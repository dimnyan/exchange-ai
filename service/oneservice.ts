import {Position} from "@/model";
import {auth} from "@/lib/firebase";

export async function getSymbols() {
  try {
    const response = await fetch("/api/symbols", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {revalidate: 60}
    },);

    const data = await response.json();
    if (!response.ok) {
      return null;
    }
    return data;
  } catch (e) {
    console.error(e)
    return {status: "error", message: e};
  }
}

export const savePosition = async (position: Omit<Position, "id">) => {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch("/api/positions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(position),
  });
  const data = await res.json();
  return data.id;
};