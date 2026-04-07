import React, { useContext, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { AuthContext } from "../auth/AuthContext";
import { colors, fonts, layout } from "../theme";
import { Ionicons } from "@expo/vector-icons";

const schema = Yup.object().shape({
  name: Yup.string().min(2, "Min 2 characters").required("Required"),
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(6, "Min 6 characters").required("Required"),
  role: Yup.string().oneOf(["user", "admin", "driver"]).required("Required"),
});

export function RegisterScreen({ navigation }) {
  const { register } = useContext(AuthContext);
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}>
          <View style={styles.card}>
            <Text style={styles.title}>Join ShopEase</Text>
            <Text style={styles.subtitle}>Create an account to start shopping premium collections.</Text>

            <Formik
              initialValues={{ name: "", email: "", password: "", role: "user" }}
              validationSchema={schema}
              onSubmit={async (values) => {
                setSubmitting(true);
                setGlobalError(null);
                try {
                  await register(values);
                  Alert.alert("Success", "Account created successfully. Please login.");
                  navigation.replace("Login");
                } catch (e) {
                  setGlobalError(e?.response?.data?.message || "An error occurred during registration.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                <>
                  <View style={[styles.inputGroup, touched.name && errors.name && styles.inputError]}>
                    <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor={colors.textMuted}
                      onChangeText={handleChange("name")}
                      onBlur={handleBlur("name")}
                      value={values.name}
                    />
                  </View>
                  {touched.name && errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

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

                  <Text style={styles.label}>Account Type</Text>
                  <View style={styles.roleRow}>
                    <Pressable
                      style={[styles.rolePill, values.role === "user" && styles.rolePillActive]}
                      onPress={() => setFieldValue("role", "user")}
                    >
                      <Text style={[styles.roleText, values.role === "user" && styles.roleTextActive]}>User</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.rolePill, values.role === "admin" && styles.rolePillActive]}
                      onPress={() => setFieldValue("role", "admin")}
                    >
                      <Text style={[styles.roleText, values.role === "admin" && styles.roleTextActive]}>Admin</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.rolePill, values.role === "driver" && styles.rolePillActive]}
                      onPress={() => setFieldValue("role", "driver")}
                    >
                      <Text style={[styles.roleText, values.role === "driver" && styles.roleTextActive]}>Driver</Text>
                    </Pressable>
                  </View>


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
                      "Create Account"
                    )}
                  </Text>
                  </Pressable>

                  <Pressable onPress={() => navigation.goBack()} style={styles.linkContainer}>
                    <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
                  </Pressable>
                </>
              )}
            </Formik>
          </View>
        </ScrollView>
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
  content: { flex: 1, padding: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.radius.xl,
    padding: 24,
    paddingVertical: 32,
    ...layout.shadows.lg,
  },
  title: { 
    color: colors.primary, 
    fontSize: 28, 
    fontFamily: fonts.heading, 
    textAlign: "center",
    marginBottom: 8 
  },
  subtitle: { 
    color: colors.textSecondary, 
    fontSize: 13, 
    fontFamily: fonts.body, 
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 18
  },
  label: { 
    color: colors.textSecondary, 
    fontSize: 12, 
    fontFamily: fonts.heading, 
    marginBottom: 10,
    textTransform: "uppercase" 
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
    fontSize: 14,
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
  errorText: { color: colors.danger, fontSize: 11, marginTop: -8, marginBottom: 12, marginLeft: 4 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  rolePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: layout.radius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  rolePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: { color: colors.textSecondary, fontFamily: fonts.heading, fontSize: 13 },
  roleTextActive: { color: colors.surface },
  button: { 
    backgroundColor: colors.primary, 
    height: 52, 
    borderRadius: layout.radius.md, 
    alignItems: "center", 
    justifyContent: "center",
    ...layout.shadows.md
  },
  buttonActive: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  buttonText: { color: colors.surface, fontSize: 16, fontFamily: fonts.heading },
  linkContainer: { marginTop: 24, alignItems: "center" },
  linkText: { color: colors.textSecondary, fontSize: 14, fontFamily: fonts.body },
  linkHighlight: { color: colors.primary, fontFamily: fonts.heading },
});

