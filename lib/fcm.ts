// src/lib/fcm.ts
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";

export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

export const requestNotificationPermission = async () => {
  if (!messaging) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (err) {
    console.error("FCM token error:", err);
    return null;
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;
  onMessage(messaging, callback);
};