import type { Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let authPromise: Promise<Auth | null> | null = null;

export function getFirebaseAuth() {
  if (!firebaseConfigured) return Promise.resolve(null);
  if (!authPromise) {
    authPromise = Promise.all([import("firebase/app"), import("firebase/auth")]).then(([appModule, authModule]) => {
      const app = appModule.getApps()[0] || appModule.initializeApp(firebaseConfig);
      return authModule.getAuth(app);
    });
  }
  return authPromise;
}
