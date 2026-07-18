import DodoPayments from "dodopayments";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

export function getDodoClient() {
  return new DodoPayments({
    bearerToken: process.env.DODO_PAYMENTS_API_KEY || "",
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode",
  });
}

export function planLabelFromProductId(productId) {
  const monthly = process.env.NEXT_PUBLIC_DODO_PAYMENTS_MONTHLY_PRODUCT_ID;
  const yearly = process.env.NEXT_PUBLIC_DODO_PAYMENTS_YEARLY_PRODUCT_ID;
  if (productId && monthly && productId === monthly) return "Pro Monthly";
  if (productId && yearly && productId === yearly) return "Pro Yearly";
  if (productId?.startsWith("promo_")) return "Promo Access";
  if (productId?.startsWith("admin_grant")) return "Admin Grant";
  return "Pro";
}

export function isManagedByDodo(subscriptionId) {
  if (!subscriptionId) return false;
  return (
    !subscriptionId.startsWith("promo_") &&
    !subscriptionId.startsWith("admin_grant") &&
    subscriptionId.startsWith("sub_")
  );
}

export async function getLocalSubscription(userId) {
  if (!userId) return null;
  const rs = await db.execute({
    sql: `SELECT user_id, subscription_id, plan_id, status, current_period_end, updated_at
          FROM user_subscriptions WHERE user_id = ?`,
    args: [userId],
  });
  if (!rs.rows.length) return null;
  const row = rs.rows[0];
  return {
    userId: row.user_id,
    subscriptionId: row.subscription_id,
    planId: row.plan_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    updatedAt: row.updated_at,
  };
}

export async function upsertLocalSubscription({
  userId,
  subscriptionId,
  planId,
  status,
  currentPeriodEnd,
}) {
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
}

/**
 * Build a full billing snapshot for the manage UI.
 * Prefer live Dodo data when the sub is a real Dodo id.
 */
export async function getBillingSnapshot(userId) {
  const local = await getLocalSubscription(userId);

  if (!local) {
    return {
      hasSubscription: false,
      source: null,
      planName: null,
      status: null,
      isActive: false,
      isPromo: false,
      isDodo: false,
      canManage: false,
      subscriptionId: null,
      planId: null,
      currentPeriodEnd: null,
      cancelAtNextBillingDate: false,
      nextBillingDate: null,
      amountDisplay: null,
      interval: null,
      customerEmail: null,
      customerId: null,
    };
  }

  const isPromo =
    local.subscriptionId?.startsWith("promo_") ||
    local.planId?.startsWith("promo_") ||
    local.subscriptionId?.startsWith("admin_grant") ||
    local.planId?.startsWith("admin_grant");

  const isDodo = isManagedByDodo(local.subscriptionId);
  const now = Math.floor(Date.now() / 1000);
  const grace = 2 * 24 * 60 * 60;
  const periodOk =
    !local.currentPeriodEnd || local.currentPeriodEnd + grace > now;
  const activeStatuses = ["active", "authenticated", "created", "pending"];
  let isActive = activeStatuses.includes(local.status) && periodOk;

  let snapshot = {
    hasSubscription: true,
    source: isDodo ? "dodo" : isPromo ? "promo" : "local",
    planName: planLabelFromProductId(local.planId),
    status: local.status,
    isActive,
    isPromo,
    isDodo,
    canManage: isDodo,
    subscriptionId: local.subscriptionId,
    planId: local.planId,
    currentPeriodEnd: local.currentPeriodEnd || null,
    cancelAtNextBillingDate: false,
    nextBillingDate: local.currentPeriodEnd
      ? new Date(local.currentPeriodEnd * 1000).toISOString()
      : null,
    amountDisplay: null,
    interval: null,
    customerEmail: null,
    customerId: null,
    currency: null,
    recurringAmountCents: null,
  };

  if (!isDodo || !process.env.DODO_PAYMENTS_API_KEY) {
    return snapshot;
  }

  try {
    const dodo = getDodoClient();
    const sub = await dodo.subscriptions.retrieve(local.subscriptionId);

    const nextEnd = sub.next_billing_date
      ? Math.floor(new Date(sub.next_billing_date).getTime() / 1000)
      : local.currentPeriodEnd;

    // Keep local DB in sync with live Dodo state
    if (
      sub.status !== local.status ||
      nextEnd !== local.currentPeriodEnd ||
      sub.product_id !== local.planId
    ) {
      await upsertLocalSubscription({
        userId,
        subscriptionId: sub.subscription_id,
        planId: sub.product_id,
        status: sub.status,
        currentPeriodEnd: nextEnd,
      });
    }

    const cents = sub.recurring_pre_tax_amount;
    const interval = sub.payment_frequency_interval; // Month | Year
    let amountDisplay = null;
    if (typeof cents === "number") {
      const dollars = (cents / 100).toFixed(2);
      amountDisplay =
        interval === "Year"
          ? `$${dollars}/year`
          : interval === "Month"
            ? `$${dollars}/month`
            : `$${dollars}`;
    }

    isActive =
      activeStatuses.includes(sub.status) &&
      (!nextEnd || nextEnd + grace > now);

    snapshot = {
      ...snapshot,
      planName: planLabelFromProductId(sub.product_id),
      status: sub.status,
      isActive,
      planId: sub.product_id,
      currentPeriodEnd: nextEnd || null,
      cancelAtNextBillingDate: !!sub.cancel_at_next_billing_date,
      nextBillingDate: sub.next_billing_date || null,
      amountDisplay,
      interval: interval || null,
      customerEmail: sub.customer?.email || null,
      customerId: sub.customer?.customer_id || null,
      currency: sub.currency || null,
      recurringAmountCents: cents ?? null,
    };
  } catch (err) {
    console.warn("[Billing] Failed to fetch live Dodo subscription:", err?.message);
  }

  return snapshot;
}
