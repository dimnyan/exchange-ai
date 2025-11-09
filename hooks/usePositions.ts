// src/hooks/usePositions.ts
import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import {Position} from "@/model";


export const usePositions = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setPositions([]);
      setLoading(false);
      return;
    }

    const positionsRef = ref(db, `users/${user.uid}/positions`);
    const unsubscribe = onValue(
      positionsRef,
      (snapshot) => {
        const data = snapshot.val();
        const list: Position[] = data
          ? Object.entries(data).map(([id, val]: [string, any]) => ({
            id,
            ...val,
          }))
          : [];
        setPositions(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => off(positionsRef, "value", unsubscribe);
  }, []);

  return { positions, loading };
};