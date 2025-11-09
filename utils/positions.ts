// src/utils/positions.ts
// src/utils/positions.ts
import { auth } from "@/lib/firebase";

export const savePosition = async (position: any) => {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const token = await auth.currentUser.getIdToken();
  const res = await fetch("/api/positions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(position),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to save position");
  }

  return (await res.json()).id;
};