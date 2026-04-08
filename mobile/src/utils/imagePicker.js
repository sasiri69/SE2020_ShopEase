import * as ImagePicker from "expo-image-picker";

export async function pickSingleImage() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("Media library permission denied");

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (res.canceled) return null;
  return res.assets[0];
}

export async function pickMultipleImages(max = 5) {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("Media library permission denied");

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsMultipleSelection: true,
    selectionLimit: max,
  });

  if (res.canceled) return [];
  return res.assets || [];
}

