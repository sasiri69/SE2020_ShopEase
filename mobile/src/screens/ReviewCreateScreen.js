import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Image, ScrollView, TextInput } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../auth/AuthContext";
import { pickMultipleImages } from "../utils/imagePicker";
import { appendImageToFormData } from "../utils/formDataHelper";
import { colors } from "../theme";

const schema = Yup.object().shape({
  rating: Yup.number().min(1, "Please pick at least 1 star to submit your review.").max(5).required("Required"),
  comment: Yup.string(),
});

export function ReviewCreateScreen({ route, navigation }) {
  const { productId, orderId, reviewToEdit } = route.params || {};
  const { api } = useContext(AuthContext);
  
  const [images, setImages] = useState(
    reviewToEdit?.images ? reviewToEdit.images.map(uri => ({ uri, isExisting: true })) : []
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{reviewToEdit ? "Edit review" : "Write review"}</Text>
      <Text style={styles.muted}>You can upload up to 3 images.</Text>

      <Formik
        initialValues={{ rating: reviewToEdit?.rating || 0, comment: reviewToEdit?.comment || "" }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const fd = new FormData();
            if (productId) fd.append("productId", productId);
            if (orderId) fd.append("orderId", orderId);
            fd.append("rating", String(values.rating));
            fd.append("comment", values.comment || "");
            for (let idx = 0; idx < Math.min(images.length, 3); idx++) {
              const img = images[idx];
              if (!img.isExisting) {
                await appendImageToFormData(fd, "images", img.uri, `review-${idx}-${Date.now()}.jpg`);
              }
            }

            if (reviewToEdit) {
              await api.put(`/reviews/${reviewToEdit._id}`, fd);
              Alert.alert("Success", "Review updated");
            } else {
              await api.post("/reviews", fd);
              Alert.alert("Success", "Review submitted");
            }
            navigation.goBack();
          } catch (e) {
            Alert.alert("Error", e?.response?.data?.message || e.message);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, setFieldValue, handleSubmit, isSubmitting, errors }) => (
          <>
            <View style={styles.box}>
              <Text style={styles.label}>Rating</Text>
              <View style={styles.row}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    style={[styles.pill, values.rating === n && styles.pillActive]}
                    onPress={() => setFieldValue("rating", n)}
                  >
                    <Text style={styles.pillText}>{n}</Text>
                  </Pressable>
                ))}
              </View>
              {errors.rating ? (
                <Text style={styles.errorText}>{errors.rating}</Text>
              ) : null}
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Comment</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Share your experience"
                placeholderTextColor="#6F7A93"
                value={values.comment}
                onChangeText={(t) => setFieldValue("comment", t)}
                multiline
              />
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Images</Text>
              <Pressable
                style={styles.actionBtn}
                onPress={async () => {
                  try {
                    const picked = await pickMultipleImages(3);
                    setImages(picked.slice(0, 3));
                  } catch (e) {
                    Alert.alert("Error", e.message);
                  }
                }}
              >
                <Text style={styles.actionText}>{images.length ? "Change images" : "Pick images"}</Text>
              </Pressable>
              {images.length ? (
                <ScrollView horizontal style={{ marginTop: 10 }} showsHorizontalScrollIndicator={false}>
                  {images.map((img, idx) => (
                    <Image key={idx} source={{ uri: img.uri }} style={styles.preview} />
                  ))}
                </ScrollView>
              ) : null}
            </View>

            <Pressable style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
              <Text style={styles.buttonText}>{isSubmitting ? "Submitting..." : "Submit review"}</Text>
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
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pillText: { color: colors.textPrimary, fontWeight: "900" },
  textInput: { color: colors.textPrimary, minHeight: 90, paddingVertical: 8 },
  actionBtn: { backgroundColor: colors.surfaceAlt, paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  actionText: { color: colors.textPrimary, fontWeight: "900" },
  preview: { width: 110, height: 110, borderRadius: 16, marginRight: 10, backgroundColor: colors.accentSoft },
  button: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#FFFFFF", fontWeight: "900" },
  errorText: { color: colors.danger, fontSize: 13, marginTop: 10, alignSelf: 'flex-start' }
});

