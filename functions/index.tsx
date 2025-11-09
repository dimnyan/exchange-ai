// functions/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {fetchPrice} from "@/functions/price";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();

const db = admin.database();
export const checkAlerts = onSchedule(
  {
    schedule: "every 1 minutes",
    region: "us-central1",
    timeoutSeconds: 60,
  },
  async () => {
    console.log("Running alert check...");

    const snapshot = await db.ref("users").once("value");
    const users = snapshot.val();

    if (!users) return;

    for (const [uid, userData] of Object.entries(users)) {
      const data = userData as any;
      const alerts = data.alerts || {};
      const fcmToken = data.fcmToken;

      for (const [alertId, alert] of Object.entries(alerts)) {
        const a = alert as any;
        if (!a.active || a.type !== "price" || a.triggered) continue;

        const symbol = a.symbol || "BTC";
        const price = await fetchPrice(symbol);

        if (price >= a.threshold) {
          console.log(`Alert triggered: ${symbol} = ${price} ≥ ${a.threshold}`);

          // Send FCM
          if (fcmToken) {
            try {
              await admin.messaging().send({
                token: fcmToken,
                notification: {
                  title: `${symbol} Price Alert!`,
                  body: `Current: $${price.toFixed(2)} ≥ Target: $${a.threshold}`,
                },
                data: {
                  alertId,
                  price: price.toString(),
                },
              });
            } catch (err) {
              console.error("FCM send failed:", err);
            }
          }

          // Mark as triggered
          await db.ref(`users/${uid}/alerts/${alertId}`).update({
            triggered: true,
            triggeredAt: Date.now(),
            triggeredPrice: price,
          });
        }
      }
    }
  });