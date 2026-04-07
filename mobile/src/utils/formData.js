export function assetToFilePart(asset, fieldName) {
  if (!asset) return null;
  const uri = asset.uri;
  const name = asset.fileName || asset.filename || `upload-${Date.now()}.jpg`;
  const type = asset.mimeType || asset.type || "image/jpeg";
  return { fieldName, part: { uri, name, type } };
}

