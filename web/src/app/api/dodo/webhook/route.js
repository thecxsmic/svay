import { Webhook } from "standardwebhooks";
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const headers = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!webhookSecret || webhookSecret === "dodo_webhook_key_placeholder") {
      console.error("[Dodo Webhook] Missing DODO_PAYMENTS_WEBHOOK_KEY");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const wh = new Webhook(webhookSecret);
    let event;
    try {
      event = wh.verify(rawBody, headers);
    } catch (err) {
      console.error("[Dodo Webhook] Verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const { type, data } = event;
    console.log(`[Dodo Webhook] Received event: ${type}`);

    // Handle subscription events
    if (type && type.startsWith("subscription.")) {
      const subscriptionId = data.subscription_id;
      const status = data.status;
      const nextBillingDate = data.next_billing_date; // ISO 8601 string
      const userId = data.metadata?.user_id;
      const planId = data.metadata?.product_id || data.product_id;

      if (userId) {
        // Convert ISO 8601 next_billing_date to Unix timestamp
        const currentPeriodEnd = nextBillingDate 
          ? Math.floor(new Date(nextBillingDate).getTime() / 1000) 
          : 0;

        await client.execute({
          sql: `INSERT OR REPLACE INTO user_subscriptions (user_id, subscription_id, plan_id, status, current_period_end, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            userId,
            subscriptionId,
            planId || "",
            status,
            currentPeriodEnd,
            Math.floor(Date.now() / 1000)
          ],
        });
        console.log(`[Dodo Webhook] Updated subscription for user ${userId}: ${status}`);
      } else {
        console.warn("[Dodo Webhook] No user_id found in metadata:", data.metadata);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
