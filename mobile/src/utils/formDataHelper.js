import { Platform } from "react-native";

export async function appendImageToFormData(fd, fieldName, uri, filename) {
  if (!uri) return;
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    fd.append(fieldName, blob, filename);
  } else {
    fd.append(fieldName, { uri, name: filename, type: "image/jpeg" });
  }
}
