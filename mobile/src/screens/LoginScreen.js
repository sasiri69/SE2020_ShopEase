import React, { useContext, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../auth/AuthContext";
import { colors, fonts, layout } from "../theme";
import { Ionicons } from "@expo/vector-icons";

const schema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(6, "Min 6 characters").required("Required"),
});

export function LoginScreen({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const loginBg = require("../../assets/homepage.jpg");

  return (
    <View style={styles.container}>
      <Image source={loginBg} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.bgOverlay} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.title}>ShopEase</Text>
          <Text style={styles.subtitle}>Welcome back! Please login to your account.</Text>

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={schema}
            onSubmit={async (values) => {
              setSubmitting(true);
              setGlobalError(null);
              try {
                await signIn(values);
              } catch (e) {
                setGlobalError(e?.response?.data?.message || "Invalid email or password");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
                <View style={[styles.inputGroup, touched.email && errors.email && styles.inputError]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    value={values.email}
                  />
                </View>
                {touched.email && errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

                <View style={[styles.inputGroup, touched.password && errors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    onChangeText={handleChange("password")}
                    onBlur={handleBlur("password")}
                    value={values.password}
                  />
                </View>
                {touched.password && errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

                {globalError ? (
                  <View style={styles.globalErrorBox}>
                    <Ionicons name="warning" size={16} color={colors.danger} />
                    <Text style={styles.globalErrorText}>{globalError}</Text>
                  </View>
                ) : null}

                <Pressable 
                  style={({ pressed }) => [
                    styles.button, 
                    (submitting || pressed) && styles.buttonActive
                  ]} 
                  onPress={handleSubmit} 
                  disabled={submitting}
                >
                  <Text style={styles.buttonText}>
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.surface} />
                    ) : (
                      "Sign In"
                    )}
                  </Text>
                </Pressable>

                <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkContainer}>
                  <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
                </Pressable>
              </>
            )}
          </Formik>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.4,
  },
  bgOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  content: { flex: 1, justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.xl,
    padding: 30,
    ...layout.shadows.lg,
  },
  title: { 
    color: colors.primary, 
    fontSize: 32, 
    fontFamily: fonts.heading, 
    textAlign: "center",
    marginBottom: 8 
  },
  subtitle: { 
    color: colors.textSecondary, 
    fontSize: 14, 
    fontFamily: fonts.body, 
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: layout.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    height: 48,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  inputError: { borderColor: colors.danger },
  globalErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerSoft,
    padding: 12,
    borderRadius: layout.radius.sm,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  globalErrorText: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  errorText: { color: colors.danger, fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 4 },
  button: { 
    backgroundColor: colors.primary, 
    height: 52, 
    borderRadius: layout.radius.md, 
    alignItems: "center", 
    justifyContent: "center",
    marginTop: 10,
    ...layout.shadows.md
  },
  buttonActive: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonText: { color: colors.surface, fontSize: 16, fontFamily: fonts.heading },
  linkContainer: { marginTop: 24, alignItems: "center" },
  linkText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.body },
  linkHighlight: { color: colors.primary, fontFamily: fonts.heading },
});

