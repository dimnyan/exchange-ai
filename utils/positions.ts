// src/utils/positions.ts
import { auth } from "@/lib/firebase";

export const savePosition = async (position: any) => {
  if (!auth.currentUser) throw new Error("Not signed in");

  const token = await auth.currentUser.getIdToken();

  const res = await fetch("/api/positions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      symbol: position.symbol,
      entry: position.entry,
      size: position.positionCoin,           // ← COIN AMOUNT
      leverage: position.leverage,
      stopLoss: position.stopLoss,
      liquidationPrice: position.liquidationPrice,
      amountEntered: position.amountEntered,
      riskUsd: position.riskUsd,
      positionUsd: position.positionUsd,
      exchange: position.exchange,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || "Save failed");
  }

  return (await res.json()).id;
};