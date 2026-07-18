import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getBillingSnapshot,
  getDodoClient,
  getLocalSubscription,
  isManagedByDodo,
  upsertLocalSubscription,
} from "@/lib/auth/billing";

export const dynamic = "force-dynamic";

/** GET — current subscription snapshot for the signed-in user */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const billing = await getBillingSnapshot(userId);
    return NextResponse.json({ success: true, billing });
  } catch (error) {
    console.error("[Billing API] GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load billing" },
      { status: 500 }
    );
  }
}

/**
 * POST actions:
 *  - cancel  → schedule cancel at next billing date
 *  - resume  → undo scheduled cancellation
 *  - portal  → create Dodo customer portal session URL
 *  - sync    → refresh from Dodo into local DB
 */
export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (!["cancel", "resume", "portal", "sync"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const local = await getLocalSubscription(userId);
    if (!local) {
      return NextResponse.json(
        { error: "No subscription found for this account" },
        { status: 404 }
      );
    }

    if (!isManagedByDodo(local.subscriptionId)) {
      return NextResponse.json(
        {
          error:
            "This access grant is managed by Svay (promo/admin) and cannot be changed in Dodo. Contact support if you need help.",
        },
        { status: 400 }
      );
    }

    if (!process.env.DODO_PAYMENTS_API_KEY) {
      return NextResponse.json({ error: "Dodo is not configured" }, { status: 500 });
    }

    const dodo = getDodoClient();

    if (action === "sync") {
      const sub = await dodo.subscriptions.retrieve(local.subscriptionId);
      const currentPeriodEnd = sub.next_billing_date
        ? Math.floor(new Date(sub.next_billing_date).getTime() / 1000)
        : 0;
      await upsertLocalSubscription({
        userId,
        subscriptionId: sub.subscription_id,
        planId: sub.product_id,
        status: sub.status,
        currentPeriodEnd,
      });
      const billing = await getBillingSnapshot(userId);
      return NextResponse.json({ success: true, billing });
    }

    if (action === "portal") {
      const sub = await dodo.subscriptions.retrieve(local.subscriptionId);
      const customerId = sub.customer?.customer_id;
      if (!customerId) {
        return NextResponse.json(
          { error: "No Dodo customer linked to this subscription" },
          { status: 400 }
        );
      }

      const base =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.DODO_PAYMENTS_RETURN_URL ||
        "http://localhost:3000";
      const returnUrl = `${base.replace(/\/$/, "")}/billing`;

      const session = await dodo.customers.customerPortal.create(customerId, {
        return_url: returnUrl,
      });

      return NextResponse.json({
        success: true,
        portalUrl: session.link,
      });
    }

    if (action === "cancel") {
      const sub = await dodo.subscriptions.update(local.subscriptionId, {
        cancel_at_next_billing_date: true,
        cancel_reason: "cancelled_by_customer",
        cancellation_feedback: body.feedback || undefined,
        cancellation_comment: body.comment || undefined,
      });

      const currentPeriodEnd = sub.next_billing_date
        ? Math.floor(new Date(sub.next_billing_date).getTime() / 1000)
        : local.currentPeriodEnd;

      await upsertLocalSubscription({
        userId,
        subscriptionId: sub.subscription_id,
        planId: sub.product_id || local.planId,
        status: sub.status,
        currentPeriodEnd,
      });

      const billing = await getBillingSnapshot(userId);
      return NextResponse.json({
        success: true,
        message: "Subscription will cancel at the end of the current period.",
        billing,
      });
    }

    if (action === "resume") {
      const sub = await dodo.subscriptions.update(local.subscriptionId, {
        cancel_at_next_billing_date: false,
      });

      const currentPeriodEnd = sub.next_billing_date
        ? Math.floor(new Date(sub.next_billing_date).getTime() / 1000)
        : local.currentPeriodEnd;

      await upsertLocalSubscription({
        userId,
        subscriptionId: sub.subscription_id,
        planId: sub.product_id || local.planId,
        status: sub.status,
        currentPeriodEnd,
      });

      const billing = await getBillingSnapshot(userId);
      return NextResponse.json({
        success: true,
        message: "Cancellation removed. Your plan will renew as usual.",
        billing,
      });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (error) {
    console.error("[Billing API] POST error:", error);
    const message =
      error?.error?.message ||
      error?.message ||
      "Billing action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
