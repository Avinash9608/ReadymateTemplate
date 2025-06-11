// src/lib/uploadImage.ts
import { storage } from "./firebase";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export async function uploadProductImage(
  file: Blob | Uint8Array,
  path: string
) {
  try {
    const imgRef = storageRef(storage, path);

    const snapshot = await uploadBytes(imgRef, file);
    // Upload complete
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (err) {
    console.error("Error uploading file:", err);
    throw err;
  }
}
