import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "../config/env.js";

function app() {
  if (getApps().length) return getApps()[0];
  const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw Object.assign(new Error("firebase_not_configured"), { status: 503 });
  }
  return initializeApp({ credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey }) });
}

export async function verifyFirebaseToken(idToken) {
  if (!idToken) throw Object.assign(new Error("firebase_token_required"), { status: 401 });
  try {
    return await getAuth(app()).verifyIdToken(String(idToken), true);
  } catch {
    throw Object.assign(new Error("invalid_firebase_token"), { status: 401 });
  }
}
