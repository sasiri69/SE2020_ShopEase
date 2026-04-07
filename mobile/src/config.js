import { Platform } from "react-native";

function defaultApiBaseUrl() {
  // Prefer explicit Expo env var when set (works on web + native).
  // Fallbacks are chosen to work out-of-the-box in common dev setups.
  if (Platform.OS === "android") return "http://10.0.2.2:5000";
  return "http://localhost:5000";
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBaseUrl();

