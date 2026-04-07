import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Image, TextInput } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../auth/AuthContext";
import { pickSingleImage } from "../utils/imagePicker";
import { appendImageToFormData } from "../utils/formDataHelper";
import { colors } from "../theme";
import { Ionicons } from "@expo/vector-icons";


export function CheckoutScreen({ navigation }) {
  const { api } = useContext(AuthContext);
  const [receipt, setReceipt] = useState(null);
  const [codProof, setCodProof] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);

  React.useEffect(() => {
    // Fetch saved cards on mount
    api.get("/saved-cards").then(res => {
      setSavedCards(res.data);
      if (res.data.length > 0) {
        setSelectedCardId(res.data[0].id); // Auto-select first card
      }
    }).catch(e => console.log("Failed to fetch saved cards", e));
  }, []);

  const dynamicSchema = React.useMemo(() => {
    const cardFieldRules = (schemaRule, requiredMsg) => {
      return Yup.string().when("paymentMethod", {
        is: "CARD",
        then: (s) => selectedCardId ? s.notRequired() : schemaRule(s).required(requiredMsg),
        otherwise: (s) => s.notRequired()
      });
    };

    return Yup.object().shape({
      address: Yup.string().min(5, "Min 5 characters").required("Required"),
      paymentMethod: Yup.string().oneOf(["COD", "CARD", "BANK_TRANSFER"]).required("Required"),
      transactionId: Yup.string(),
      cardNumber: cardFieldRules((s) => s.matches(/^(\d\s*){15,16}$/, "Must be 15 or 16 digits"), "Card number required"),
      cardExpiry: cardFieldRules((s) => s.matches(/^(0[1-9]|1[0-2])\/\d{2}$/, "Format MM/YY")
        .test('is-not-expired', 'Card has expired', (value) => {
          if (!value || value.length !== 5) return false;
          const [month, year] = value.split('/');
          const expMonth = parseInt(month, 10);
          const expYear = parseInt(year, 10);
          const now = new Date();
          const currentYear = now.getFullYear() % 100;
          const currentMonth = now.getMonth() + 1;
          if (expYear < currentYear) return false;
          if (expYear === currentYear && expMonth < currentMonth) return false;
          return true;
        }), "Expiry required"),
      cardCVC: cardFieldRules((s) => s.matches(/^(\d\s*){3,4}$/, "Must be 3 or 4 digits"), "CVC required"),
      cardName: cardFieldRules((s) => s, "Name required"),
    });
  }, [selectedCardId]);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.muted}>Creates Order → Payment → Delivery</Text>

      <Formik
        initialValues={{ address: "", paymentMethod: "COD", transactionId: "", cardNumber: "", cardExpiry: "", cardCVC: "", cardName: "" }}
        validationSchema={dynamicSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            let finalPaymentMethodId = selectedCardId || "";

            if (values.paymentMethod === "CARD" && !selectedCardId) {
              const [month, year] = values.cardExpiry.split("/");
              try {
                const newCardRes = await api.post("/saved-cards", {
                  cardNumber: values.cardNumber.replace(/\s+/g, ""),
                  expMonth: parseInt(month, 10),
                  expYear: parseInt("20" + year, 10),
                  cvc: values.cardCVC.replace(/\s+/g, ""),
                  name: values.cardName
                });
                finalPaymentMethodId = newCardRes.data.id;
              } catch (e) {
                throw new Error(e?.response?.data?.message || "Failed to save card. Check details.");
              }
            }

            const orderRes = await api.post("/orders", { fromCart: true });
            const orderId = orderRes.data._id;

            const fd = new FormData();
            fd.append("orderId", orderId);
            fd.append("paymentMethod", values.paymentMethod);
            if (finalPaymentMethodId) fd.append("paymentMethodId", finalPaymentMethodId);
            fd.append("transactionId", values.transactionId || "");
            fd.append("address", values.address);
            if (receipt) {
              await appendImageToFormData(fd, "receiptImage", receipt.uri, `receipt-${Date.now()}.jpg`);
            }
            if (codProof) {
              await appendImageToFormData(fd, "codProofImage", codProof.uri, `cod-proof-${Date.now()}.jpg`);
            }

            await api.post("/payments", fd);
            Alert.alert("Success", "Order placed");
            navigation.replace("Orders");
          } catch (e) {
            Alert.alert("Error", e?.response?.data?.message || e.message);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, errors, touched, setFieldValue, handleChange, handleSubmit, isSubmitting }) => (
          <>
            <View style={styles.box}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.textInput}
                value={values.address}
                onChangeText={handleChange("address")}
                placeholder="Type delivery address"
                placeholderTextColor="#6F7A93"
                multiline
              />
              {touched.address && errors.address ? <Text style={styles.error}>{errors.address}</Text> : null}
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Payment method</Text>
              <View style={styles.row}>
                {["COD", "CARD", "BANK_TRANSFER"].map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.pill, values.paymentMethod === m && styles.pillActive]}
                    onPress={() => setFieldValue("paymentMethod", m)}
                  >
                    <Text style={styles.pillText}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {values.paymentMethod === "BANK_TRANSFER" ? (
              <View style={styles.box}>
                <Text style={styles.label}>Transaction ID (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={values.transactionId}
                  onChangeText={handleChange("transactionId")}
                  placeholder="e.g. bank reference"
                  placeholderTextColor="#6F7A93"
                />
              </View>
            ) : null}

            {values.paymentMethod === "CARD" ? (
              <View style={styles.box}>
                <Text style={styles.label}>Card Details</Text>
                
                {savedCards.length > 0 ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={[styles.label, { fontSize: 13, marginBottom: 8 }]}>Select a saved card:</Text>
                    {savedCards.map(c => (
                      <Pressable 
                        key={c.id} 
                        style={[styles.savedCardItem, selectedCardId === c.id && styles.savedCardItemActive]}
                        onPress={() => setSelectedCardId(c.id)}
                      >
                        <Ionicons name={selectedCardId === c.id ? "radio-button-on" : "radio-button-off"} size={20} color={selectedCardId === c.id ? colors.accent : colors.textMuted} />
                        <Ionicons name="card-outline" size={20} color={colors.textPrimary} style={{ marginLeft: 8, marginRight: 8 }} />
                        <Text style={{ color: colors.textPrimary, flex: 1 }}>{c.brand.toUpperCase()} ending in {c.last4}</Text>
                        <Text style={{ color: colors.textSecondary }}>{c.expMonth}/{c.expYear}</Text>
                      </Pressable>
                    ))}

                    <Pressable 
                        style={[styles.savedCardItem, selectedCardId === null && styles.savedCardItemActive, { marginTop: 8 }]}
                        onPress={() => setSelectedCardId(null)}
                      >
                        <Ionicons name={selectedCardId === null ? "radio-button-on" : "radio-button-off"} size={20} color={selectedCardId === null ? colors.accent : colors.textMuted} />
                        <Text style={{ color: colors.textPrimary, marginLeft: 8 }}>Use a different card</Text>
                      </Pressable>
                  </View>
                ) : null}

                {!selectedCardId && (
                  <View>
                    <TextInput
                      style={styles.textInput}
                      value={values.cardNumber}
                      onChangeText={handleChange("cardNumber")}
                      placeholder="Card Number (15-16 digits)"
                      placeholderTextColor="#6F7A93"
                      keyboardType="numeric"
                      maxLength={19}
                    />
                    {touched.cardNumber && errors.cardNumber ? <Text style={styles.error}>{errors.cardNumber}</Text> : null}
                    
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <TextInput
                          style={styles.textInput}
                          value={values.cardExpiry}
                          onChangeText={handleChange("cardExpiry")}
                          placeholder="MM/YY"
                          placeholderTextColor="#6F7A93"
                          maxLength={5}
                        />
                        {touched.cardExpiry && errors.cardExpiry ? <Text style={styles.error}>{errors.cardExpiry}</Text> : null}
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <TextInput
                          style={styles.textInput}
                          value={values.cardCVC}
                          onChangeText={handleChange("cardCVC")}
                          placeholder="CVC"
                          placeholderTextColor="#6F7A93"
                          keyboardType="numeric"
                          maxLength={4}
                        />
                        {touched.cardCVC && errors.cardCVC ? <Text style={styles.error}>{errors.cardCVC}</Text> : null}
                      </View>
                    </View>
                    
                    <TextInput
                      value={values.cardName}
                      onChangeText={handleChange("cardName")}
                      placeholder="Name on Card"
                      placeholderTextColor="#6F7A93"
                      style={[styles.textInput, { marginTop: 10 }]}
                    />
                    {touched.cardName && errors.cardName ? <Text style={styles.error}>{errors.cardName}</Text> : null}
                  </View>
                )}
              </View>
            ) : null}

            {values.paymentMethod === "COD" ? (
              <View style={styles.box}>
                <Text style={styles.label}>Order confirm prove card (Required for COD)</Text>
                <Pressable
                  style={styles.actionBtn}
                  onPress={async () => {
                    try {
                      const asset = await pickSingleImage();
                      if (asset) setCodProof(asset);
                    } catch (e) {
                      Alert.alert("Error", e.message);
                    }
                  }}
                >
                  <Text style={styles.actionText}>{codProof ? "Change proof card" : "Pick proof card"}</Text>
                </Pressable>
                {codProof ? <Image source={{ uri: codProof.uri }} style={styles.preview} /> : null}
              </View>
            ) : null}

            {values.paymentMethod === "BANK_TRANSFER" ? (
              <View style={styles.box}>
                <Text style={styles.label}>Receipt image (Optional for Bank Transfer)</Text>
                <Pressable
                  style={styles.actionBtn}
                  onPress={async () => {
                    try {
                      const asset = await pickSingleImage();
                      if (asset) setReceipt(asset);
                    } catch (e) {
                      Alert.alert("Error", e.message);
                    }
                  }}
                >
                  <Text style={styles.actionText}>{receipt ? "Change receipt" : "Pick receipt"}</Text>
                </Pressable>
                {receipt ? <Image source={{ uri: receipt.uri }} style={styles.preview} /> : null}
              </View>
            ) : null}

            <Pressable style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
              <Text style={styles.buttonText}>{isSubmitting ? "Placing..." : "Place order"}</Text>
            </Pressable>
          </>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: "900" },
  muted: { color: colors.textSecondary, marginTop: 6, marginBottom: 14 },
  box: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, marginBottom: 12 },
  label: { color: colors.textSecondary, marginBottom: 8, fontWeight: "800" },
  textInput: { color: colors.textPrimary, minHeight: 44, paddingVertical: 8 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pillText: { color: colors.textPrimary, fontWeight: "900" },
  actionBtn: { backgroundColor: colors.surfaceAlt, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  actionText: { color: colors.textPrimary, fontWeight: "900" },
  preview: { width: "100%", height: 180, borderRadius: 14, marginTop: 10, backgroundColor: colors.accentSoft },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#FFFFFF", fontWeight: "900" },
  error: { color: colors.danger, marginTop: 8 },
  savedCardItem: { flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: colors.surfaceAlt, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  savedCardItemActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
});

