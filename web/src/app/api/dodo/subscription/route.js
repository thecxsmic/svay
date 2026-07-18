import DodoPayments from "dodopayments";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const planType = body.planType || "monthly";

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey || apiKey === "dodo_api_key_placeholder") {
      console.error("[Dodo Payments] Missing DODO_PAYMENTS_API_KEY");
      return NextResponse.json({ error: "Dodo Payments is not configured correctly on the server" }, { status: 500 });
    }

    const client = new DodoPayments({
      bearerToken: apiKey,
      environment: process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode",
    });

    let userEmail = "";
    let userName = "";
    try {
      const user = await currentUser();
      userEmail = user?.emailAddresses[0]?.emailAddress || "";
      userName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Svay User";
    } catch (e) {
      console.warn("Failed to retrieve user details from Clerk:", e);
    }

    let productId;
    const isAdmin = userEmail === "thecxsmic@gmail.com";

    if (isAdmin && process.env.NEXT_PUBLIC_DODO_PAYMENTS_ADMIN_PRODUCT_ID && process.env.NEXT_PUBLIC_DODO_PAYMENTS_ADMIN_PRODUCT_ID !== "prod_admin_placeholder") {
      productId = process.env.NEXT_PUBLIC_DODO_PAYMENTS_ADMIN_PRODUCT_ID;
    } else {
      productId = planType === "yearly"
        ? process.env.NEXT_PUBLIC_DODO_PAYMENTS_YEARLY_PRODUCT_ID
        : process.env.NEXT_PUBLIC_DODO_PAYMENTS_MONTHLY_PRODUCT_ID;
    }

    if (!productId || productId.includes("placeholder")) {
      console.error("[Dodo Payments] Missing product ID configuration for planType:", planType);
      return NextResponse.json({ error: "Dodo Payments product ID is not configured correctly" }, { status: 500 });
    }

    console.log(`[Dodo Payments] Creating checkout session for user: ${userId}, Product: ${productId} (${planType})`);

    const baseReturn =
      process.env.DODO_PAYMENTS_RETURN_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    // Flag return so the client can reconcile subscription if webhooks lag
    const returnUrl = `${baseReturn.replace(/\/$/, "")}/?checkout=success&plan=${planType}`;

    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer: {
        email: userEmail || "user@svay.space",
        name: userName,
      },
      // Checkout metadata is copied onto payment + subscription objects
      metadata: {
        user_id: userId,
        product_id: productId,
        plan_type: planType,
      },
      // Monthly product already has 7-day trial in Dodo; pass through for yearly if desired later
      subscription_data:
        planType === "monthly"
          ? { trial_period_days: 7 }
          : undefined,
      return_url: returnUrl,
    });

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (error) {
    console.error("Dodo Payments Checkout Error:", error);
    const status = typeof error?.status === "number" ? error.status : 500;
    let message = error?.message || "Failed to create checkout session";

    // Surface a clearer hint when Dodo rejects the API key / environment
    if (status === 401 || /401|unauthorized/i.test(message)) {
      message =
        "Dodo Payments rejected the API key. Check that DODO_PAYMENTS_API_KEY matches DODO_PAYMENTS_ENVIRONMENT (test_mode vs live_mode).";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ error: message }, { status: status >= 400 && status < 600 ? status : 500 });
  }
}
