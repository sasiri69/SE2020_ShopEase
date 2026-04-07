import React from "react";
import { Pressable, StyleSheet, Text, ActivityIndicator } from "react-native";
import { colors, fonts } from "../theme";

export function Button({
  title,
  onPress,
  variant = "primary", // primary | secondary | outline | danger
  size = "md", // sm | md | lg
  disabled,
  loading,
  style,
}) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        (pressed && !isDisabled) ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "outline" ? colors.textPrimary : "#FFFFFF"} />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`]]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    flexDirection: "row",
    gap: 8,
  },
  sm: { paddingVertical: 10 },
  md: { paddingVertical: 12 },
  lg: { paddingVertical: 14 },

  primary: { backgroundColor: colors.accent, borderWidth: 1, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.accent },
  danger: { backgroundColor: colors.danger, borderWidth: 1, borderColor: colors.danger },

  text: { fontFamily: fonts.button, fontSize: 14, letterSpacing: 0.2 },
  text_primary: { color: "#FFFFFF" },
  text_secondary: { color: colors.textPrimary },
  text_outline: { color: colors.accent },
  text_danger: { color: "#FFFFFF" },

  pressed: { transform: [{ translateY: 1 }], opacity: 0.95 },
  disabled: { opacity: 0.65 },
});

