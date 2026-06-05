import * as ImageManipulator from 'expo-image-manipulator';

// Comprime cualquier imagen (HEIC, PNG, WebP, JPEG) a JPEG y devuelve base64
// Máximo 1000px de ancho, quality 0.5 → bien por debajo del max_allowed_packet de MySQL
export async function uriToBase64(uri) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1000 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  return `data:image/jpeg;base64,${result.base64}`;
}
