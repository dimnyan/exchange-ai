// src/lib/admin.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";

let serviceAccount: any;

try {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT");
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error("Invalid FIREBASE_SERVICE_ACCOUNT:", err);
  throw new Error("Check .env.local – service account must be valid one-line JSON");
}

// ← Use SERVER-ONLY env var
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
if (!databaseURL) {
  throw new Error("Missing FIREBASE_DATABASE_URL in .env.local");
}

export const adminApp =
  getApps().length === 0
    ? initializeApp({
      credential: cert(serviceAccount),
      databaseURL, // ← Safe
    })
    : getApps()[0];