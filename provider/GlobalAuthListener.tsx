// src/components/GlobalAuthListener.tsx
"use client";

import { useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { ref, set, onValue } from "firebase/database";
import { auth, db } from "@/lib/firebase";

/**
 * GlobalAuthListener
 * - Runs once at app start
 * - Keeps auth state in sync
 * - Auto-creates user profile on first sign-in
 */
export default function GlobalAuthListener() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        // User signed out → nothing to do
        return;
      }

      const profileRef = ref(db, `users/${user.uid}/profile`);

      // Check if profile exists
      const snapshot = await new Promise<any>((resolve) => {
        const off = onValue(profileRef, (snap) => {
          off(); // Remove listener immediately
          resolve(snap.val());
        }, { onlyOnce: true });
      });

      if (!snapshot) {
        // First-time login → create default profile
        await set(profileRef, {
          email: user.email!,
          name: user.displayName || user.email!.split("@")[0],
          riskPct: 1, // Default 1% risk per trade
          createdAt: Date.now(),
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // This component renders nothing
  return null;
};