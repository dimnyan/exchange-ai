// src/components/GlobalAuthListener.tsx
"use client";

import { useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {onValue, ref, set} from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { requestNotificationPermission } from "@/lib/fcm";

export default function GlobalAuthListener() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;

      const profileRef = ref(db, `users/${user.uid}/profile`);
      const snapshot = await new Promise<any>((resolve) => {
        const off = onValue(profileRef, (snap) => {
          off();
          resolve(snap.val());
        }, { onlyOnce: true });
      });

      if (!snapshot) {
        await set(profileRef, {
          email: user.email!,
          name: user.displayName || user.email!.split("@")[0],
          riskPct: 1,
          createdAt: Date.now(),
        });
      }

      // Register FCM token
      const token = await requestNotificationPermission();
      if (token) {
        await set(ref(db, `users/${user.uid}/fcmToken`), token);
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}