// src/app/api/positions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { adminApp } from "@/lib/admin";

const auth = getAuth(adminApp);
const db = getDatabase(adminApp);

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) return NextResponse.json({ error: "No token" }, { status: 401 });

    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const {
      symbol,
      entry,
      size,
      leverage,
      stopLoss,
      liquidationPrice,
      amountEntered,
      riskUsd,
      positionUsd,
      exchange,
    } = body;

    if (!symbol || !entry || !size || !leverage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const positionsRef = db.ref(`users/${uid}/positions`);
    const newRef = positionsRef.push();

    await newRef.set({
      symbol,
      entry,
      size,
      leverage,
      stopLoss,
      liquidationPrice,
      amountEntered,
      riskUsd,
      positionUsd,
      exchange: exchange || "binance",
      createdAt: Date.now(),
    });

    return NextResponse.json({ id: newRef.key });
  } catch (err: any) {
    console.error("Save error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}