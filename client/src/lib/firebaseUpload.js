import { initializeApp } from "firebase/app";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

let app;
let storage;

function firebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  if (!apiKey || !storageBucket) return null;
  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
}

export function firebaseGalleryUploadsEnabled() {
  return Boolean(firebaseConfig());
}

export async function uploadGalleryImageToFirebase(file, folder = "gallery") {
  const config = firebaseConfig();
  if (!config) return null;
  if (!app) app = initializeApp(config);
  if (!storage) storage = getStorage(app);
  const safeName = String(file.name || "image.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileRef = ref(storage, `${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`);
  const snapshot = await uploadBytes(fileRef, file, { contentType: file.type || "image/jpeg" });
  return getDownloadURL(snapshot.ref);
}
