// src/hooks/useUserProfile.ts
"use client";

import {useEffect, useState} from "react";
import {onAuthStateChanged, User} from "firebase/auth";
import {onValue, ref, set} from "firebase/database";
import {auth, db} from "@/lib/firebase";
import {UserProfile} from "@/model";


export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = ref(db, `users/${user.uid}/profile`);
      const off = onValue(profileRef, (snap) => {
        setProfile(snap.val() || null);
        setLoading(false);
      });

      return () => off();
    });

    return unsubscribe;
  }, []);

  return { profile, loading };
};