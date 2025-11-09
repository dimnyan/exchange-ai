// src/hooks/usePositions.ts
import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import {Position} from "@/model";
import {onAuthStateChanged} from "firebase/auth";


export const usePositions = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setPositions([]);
        setLoading(false);
        return;
      }

      const positionsRef = ref(db, `users/${user.uid}/positions`);

      const unsubscribePositions = onValue(
        positionsRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            setPositions([]);
            setLoading(false);
            return;
          }

          const list: Position[] = Object.entries(data).map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }));

          setPositions(list);
          setLoading(false);
        },
        (error) => {
          console.error("Positions error:", error);
          setLoading(false);
        }
      );

      return () => {
        off(positionsRef, "value", unsubscribePositions);
      };
    });

    return unsubscribeAuth;
  }, []);

  return { positions, loading };
};