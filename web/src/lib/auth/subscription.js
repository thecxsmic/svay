import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

export async function getSubscriptionStatus(userId) {
  if (!userId) return null;

  try {
    const rs = await client.execute({
      sql: "SELECT status, current_period_end, subscription_id, plan_id FROM user_subscriptions WHERE user_id = ?",
      args: [userId],
    });

    if (rs.rows.length === 0) return null;

    const row = rs.rows[0];
    const now = Math.floor(Date.now() / 1000);

    // Razorpay: created, authenticated, active | Dodo: pending (trial start), active
    const activeStatuses = ["active", "authenticated", "created", "pending"];
    const isStatusValid = activeStatuses.includes(row.status);

    // Even if status is active, check period end (2-day grace for webhook lag)
    const gracePeriod = 2 * 24 * 60 * 60;
    const isPeriodValid =
      row.current_period_end === 0 || row.current_period_end + gracePeriod > now;

    const isActive = isStatusValid && isPeriodValid;

    return {
      status: row.status,
      isActive,
      isHalted: row.status === "halted" || row.status === "on_hold",
      isExpired:
        row.status === "expired" ||
        row.status === "cancelled" ||
        row.status === "failed",
      currentPeriodEnd: row.current_period_end,
      subscriptionId: row.subscription_id,
      planId: row.plan_id,
    };
  } catch (error) {
    console.error("Get Subscription Status Error:", error);
    return null;
  }
}
