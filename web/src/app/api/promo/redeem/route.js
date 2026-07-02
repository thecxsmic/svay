import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@libsql/client";
import crypto from "crypto";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const rawCode = body.code;

    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json({ error: "Promo code is required" }, { status: 400 });
    }

    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Invalid promo code format" }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);

    // Fetch the promo code details
    const codeQuery = await client.execute({
      sql: "SELECT * FROM promo_codes WHERE code = ?",
      args: [code],
    });

    if (codeQuery.rows.length === 0) {
      return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
    }

    const promo = codeQuery.rows[0];

    // Check if code has expired
    if (promo.expires_at && promo.expires_at > 0 && promo.expires_at < now) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
    }

    // Check if max uses has been reached
    if (promo.max_uses && promo.max_uses > 0 && promo.uses_count >= promo.max_uses) {
      return NextResponse.json({ error: "This promo code is no longer available (limit reached)" }, { status: 400 });
    }

    // Check if user already redeemed this specific code
    const redemptionQuery = await client.execute({
      sql: "SELECT id FROM promo_redemptions WHERE user_id = ? AND code = ?",
      args: [userId, code],
    });

    if (redemptionQuery.rows.length > 0) {
      return NextResponse.json({ error: "You have already redeemed this promo code" }, { status: 400 });
    }

    const durationDays = promo.duration_days || 30;
    const expiresAt = now + (durationDays * 24 * 60 * 60);
    const redemptionId = crypto.randomUUID();
    const subscriptionId = `promo_${code.toLowerCase()}_${crypto.randomBytes(4).toString("hex")}`;
    const planId = `promo_${durationDays}d`;

    // Perform database updates
    const transaction = await client.transaction();
    try {
      // 1. Insert/Replace User Subscription
      await transaction.execute({
        sql: `INSERT OR REPLACE INTO user_subscriptions (user_id, subscription_id, plan_id, status, current_period_end, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [userId, subscriptionId, planId, "active", expiresAt, now],
      });

      // 2. Log the redemption
      await transaction.execute({
        sql: `INSERT INTO promo_redemptions (id, user_id, code, redeemed_at, expires_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [redemptionId, userId, code, now, expiresAt],
      });

      // 3. Increment usage count
      await transaction.execute({
        sql: "UPDATE promo_codes SET uses_count = uses_count + 1 WHERE code = ?",
        args: [code],
      });

      await transaction.commit();
    } catch (txError) {
      await transaction.rollback();
      throw txError;
    }

    return NextResponse.json({
      success: true,
      message: `Promo code redeemed! You got ${durationDays} days of free Pro access.`,
      expiresAt,
    });
  } catch (error) {
    console.error("Promo Redemption Error:", error);
    return NextResponse.json(
      { error: "Internal server error during promo code redemption" },
      { status: 500 }
    );
  }
}
