import DodoPayments from "dodopayments";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@libsql/client";

export const dynamic = "force-dynamic";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

/**
 * Reconcile the signed-in user's subscription from Dodo → Turso.
 * Used as a fallback when webhooks fail (e.g. wrong prod secret / local dev).
 *
 * POST /api/dodo/sync
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Dodo not configured" }, { status: 500 });
    }

    const dodo = new DodoPayments({
      bearerToken: apiKey,
      environment: process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode",
    });

    // Walk recent subscriptions and match metadata.user_id
    // (Dodo list API has no metadata filter, so we scan recent pages)
    const matches = [];
    let scanned = 0;
    const MAX_SCAN = 100;

    for await (const sub of dodo.subscriptions.list({ page_size: 50 })) {
      scanned += 1;
      const metaUser =
        sub.metadata?.user_id || sub.metadata?.userId || sub.metadata?.clerk_user_id;
      if (metaUser === userId) {
        matches.push(sub);
      }
      if (scanned >= MAX_SCAN) break;
    }

    if (matches.length === 0) {
      return NextResponse.json({
        success: false,
        found: false,
        message: "No Dodo subscription found for this user yet.",
        scanned,
      });
    }

    // Prefer active / on_hold / pending over cancelled
    const rank = (s) => {
      const order = { active: 0, pending: 1, on_hold: 2, cancelled: 3, failed: 4, expired: 5 };
      return order[s.status] ?? 9;
    };
    matches.sort((a, b) => rank(a) - rank(b));
    const best = matches[0];

    const currentPeriodEnd = best.next_billing_date
      ? Math.floor(new Date(best.next_billing_date).getTime() / 1000)
      : 0;

    await db.execute({
      sql: `INSERT OR REPLACE INTO user_subscriptions
              (user_id, subscription_id, plan_id, status, current_period_end, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        best.subscription_id,
        best.product_id || best.metadata?.product_id || "",
        best.status,
        currentPeriodEnd,
        Math.floor(Date.now() / 1000),
      ],
    });

    console.log(
      `[Dodo Sync] Synced user=${userId} sub=${best.subscription_id} status=${best.status}`
    );

    return NextResponse.json({
      success: true,
      found: true,
      subscription: {
        subscriptionId: best.subscription_id,
        status: best.status,
        planId: best.product_id,
        currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error("[Dodo Sync] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
