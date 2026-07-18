import DodoPayments from "dodopayments";
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export const runtime = "nodejs";
// Ensure we always read the raw body for signature verification
export const dynamic = "force-dynamic";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

function getDodoClient() {
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY || "",
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode",
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || null,
  });
}

function toUnix(dateLike) {
  if (!dateLike) return 0;
  const ms = new Date(dateLike).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : 0;
}

/**
 * Extract clerk user id from webhook payload metadata (checkout metadata
 * is copied onto both payment + subscription objects by Dodo).
 */
function extractUserId(data = {}) {
  return (
    data.metadata?.user_id ||
    data.metadata?.userId ||
    data.metadata?.clerk_user_id ||
    null
  );
}

async function upsertSubscription({
  userId,
  subscriptionId,
  planId,
  status,
  currentPeriodEnd,
}) {
  if (!userId || !subscriptionId) {
    console.warn("[Dodo Webhook] Skipping upsert — missing userId or subscriptionId", {
      userId,
      subscriptionId,
    });
    return false;
  }

  await db.execute({
    sql: `INSERT OR REPLACE INTO user_subscriptions
            (user_id, subscription_id, plan_id, status, current_period_end, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      userId,
      subscriptionId,
      planId || "",
      status || "active",
      currentPeriodEnd || 0,
      Math.floor(Date.now() / 1000),
    ],
  });

  console.log(
    `[Dodo Webhook] Upserted subscription user=${userId} sub=${subscriptionId} status=${status}`
  );
  return true;
}

async function handleSubscriptionEvent(data) {
  const userId = extractUserId(data);
  const subscriptionId = data.subscription_id;
  const status = data.status;
  const planId = data.product_id || data.metadata?.product_id || "";
  const currentPeriodEnd = toUnix(data.next_billing_date);

  if (!userId) {
    console.warn(
      "[Dodo Webhook] subscription event missing metadata.user_id — cannot map to Clerk user",
      { subscriptionId, metadata: data.metadata }
    );
    return { ok: false, reason: "missing_user_id" };
  }

  await upsertSubscription({
    userId,
    subscriptionId,
    planId,
    status,
    currentPeriodEnd,
  });
  return { ok: true };
}

async function handlePaymentEvent(data) {
  const userId = extractUserId(data);
  const subscriptionId = data.subscription_id;
  if (!userId || !subscriptionId) {
    // One-time payments without a subscription are ignored
    console.log("[Dodo Webhook] payment event skipped (no user_id or subscription_id)", {
      userId,
      subscriptionId,
      paymentId: data.payment_id,
      status: data.status,
    });
    return { ok: false, reason: "not_subscription_payment" };
  }

  // payment.succeeded during trial/activation — mark active if we have the link
  const status =
    data.status === "succeeded" || data.status === "processing"
      ? "active"
      : data.status === "failed" || data.status === "cancelled"
        ? "failed"
        : data.status || "active";

  const planId = data.product_id || data.metadata?.product_id || "";
  // Prefer subscription next billing if present on payment payload; else leave 0
  // (subscription.* events will overwrite with the real period end)
  const currentPeriodEnd = toUnix(data.next_billing_date || data.subscription_next_billing_date);

  await upsertSubscription({
    userId,
    subscriptionId,
    planId,
    status,
    currentPeriodEnd,
  });
  return { ok: true };
}

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const webhookHeaders = {
      "webhook-id": req.headers.get("webhook-id") || "",
      "webhook-signature": req.headers.get("webhook-signature") || "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") || "",
    };

    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!webhookSecret || webhookSecret === "dodo_webhook_key_placeholder") {
      console.error("[Dodo Webhook] Missing DODO_PAYMENTS_WEBHOOK_KEY");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    if (!webhookHeaders["webhook-id"] || !webhookHeaders["webhook-signature"] || !webhookHeaders["webhook-timestamp"]) {
      console.error("[Dodo Webhook] Missing signature headers", {
        hasId: !!webhookHeaders["webhook-id"],
        hasSig: !!webhookHeaders["webhook-signature"],
        hasTs: !!webhookHeaders["webhook-timestamp"],
      });
      return NextResponse.json({ error: "Missing webhook headers" }, { status: 400 });
    }

    let event;
    try {
      // Prefer official SDK unwrap (Standard Webhooks)
      const dodo = getDodoClient();
      event = dodo.webhooks.unwrap(rawBody, {
        headers: webhookHeaders,
        key: webhookSecret,
      });
    } catch (err) {
      console.error("[Dodo Webhook] Verification failed:", err?.message || err, {
        webhookId: webhookHeaders["webhook-id"],
        ts: webhookHeaders["webhook-timestamp"],
        bodyLen: rawBody?.length,
        secretPrefix: webhookSecret?.slice(0, 8),
      });
      return NextResponse.json(
        { error: "Invalid signature", detail: err?.message || "verify_failed" },
        { status: 400 }
      );
    }

    const type = event?.type || "";
    const data = event?.data || {};
    console.log(`[Dodo Webhook] Received event: ${type}`, {
      payload_type: data.payload_type,
      subscription_id: data.subscription_id,
      payment_id: data.payment_id,
      status: data.status,
      has_user_id: !!extractUserId(data),
    });

    let result = { ok: true, handled: false };

    if (type.startsWith("subscription.")) {
      result = { ...(await handleSubscriptionEvent(data)), handled: true };
    } else if (
      type === "payment.succeeded" ||
      type === "payment.failed" ||
      type === "payment.cancelled" ||
      type === "payment.processing"
    ) {
      result = { ...(await handlePaymentEvent(data)), handled: true };
    } else {
      console.log(`[Dodo Webhook] Ignoring unhandled event type: ${type}`);
    }

    // Always 200 so Dodo does not keep retrying for "soft" skips
    return NextResponse.json({ received: true, type, ...result });
  } catch (error) {
    console.error("[Dodo Webhook] Handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", detail: error?.message },
      { status: 500 }
    );
  }
}
