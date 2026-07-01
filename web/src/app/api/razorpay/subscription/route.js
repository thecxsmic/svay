import Razorpay from "razorpay";
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

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("[Razorpay] Missing configuration:", { key_id: !!key_id, key_secret: !!key_secret });
      return NextResponse.json({ error: "Razorpay is not configured correctly on the server" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    let planId;
    let isAdmin = false;
    try {
      const user = await currentUser();
      const userEmail = user?.emailAddresses[0]?.emailAddress;
      if (userEmail === "thecxsmic@gmail.com") {
        isAdmin = true;
      }
    } catch (e) {
      console.warn("Failed to retrieve user email for admin check:", e);
    }

    if (isAdmin) {
      const adminPlanName = `Svay Admin Special ₹1 ${planType === "yearly" ? "Yearly" : "Monthly"}`;
      try {
        const existingPlans = await razorpay.plans.all({ count: 100 });
        const foundPlan = existingPlans.items?.find(p => p.item?.name === adminPlanName);
        if (foundPlan) {
          planId = foundPlan.id;
          console.log(`[Razorpay] Found existing admin plan: ${planId}`);
        } else {
          const newPlan = await razorpay.plans.create({
            period: planType === "yearly" ? "yearly" : "monthly",
            interval: 1,
            item: {
              name: adminPlanName,
              amount: 100, // 100 paise = 1 Rs
              currency: "INR",
              description: `Special ₹1 ${planType === "yearly" ? "yearly" : "monthly"} plan for admin`
            }
          });
          planId = newPlan.id;
          console.log(`[Razorpay] Created new admin plan: ${planId}`);
        }
      } catch (err) {
        console.error("[Razorpay] Error fetching or creating admin plan, falling back to standard plan:", err);
      }
    }

    if (!planId) {
      planId = planType === "yearly"
        ? process.env.NEXT_PUBLIC_RAZORPAY_YEARLY_PLAN_ID
        : process.env.NEXT_PUBLIC_RAZORPAY_PLAN_ID;
    }

    if (!planId) {
      console.error("[Razorpay] Missing plan ID configuration for planType:", planType);
      return NextResponse.json({ error: "Razorpay plan ID is not configured correctly on the server" }, { status: 500 });
    }

    console.log(`[Razorpay] Creating subscription for user: ${userId}, Plan: ${planId} (${planType})`);

    // 7 days from now (in seconds)
    const sevenDaysFromNow = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
    const totalCount = planType === "yearly" ? 5 : 60; // 5 years for yearly, 5 years (60 cycles) for monthly

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      start_at: sevenDaysFromNow, // Trial ends after 7 days
      notes: {
        user_id: userId
      }
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Razorpay Subscription Error:", error);
    const message = error.error?.description || error.message || "Failed to create subscription";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
