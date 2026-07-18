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

    // Razorpay statuses: created, authenticated, active, cancelled, expired, halted
    const activeStatuses = ["active", "authenticated", "created"];
    const isStatusValid = activeStatuses.includes(row.status);
    
    // Safety check: Even if status is active, check if we've passed the period end 
    // (with a 2-day grace period for webhook processing)
    const gracePeriod = 2 * 24 * 60 * 60; 
    const isPeriodValid = row.current_period_end === 0 || (row.current_period_end + gracePeriod) > now;

    const isActive = isStatusValid && isPeriodValid;
    
    return {
      status: row.status,
      isActive: isActive,
      isHalted: row.status === "halted" || row.status === "on_hold",
      isExpired: row.status === "expired" || row.status === "cancelled" || row.status === "failed",
      currentPeriodEnd: row.current_period_end,
      subscriptionId: row.subscription_id,
      planId: row.plan_id
    };
  } catch (error) {
    console.error("Get Subscription Status Error:", error);
    return null;
  }
}
