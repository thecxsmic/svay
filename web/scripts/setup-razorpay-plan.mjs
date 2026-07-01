import { config } from "dotenv";
config({ path: ".env.local" });
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function setupPlan() {
  console.log("Setting up Razorpay Plan: $19/month...");

  try {
    // 19 USD is approx 1580 INR (using INR as default currency for many Razorpay test accounts)
    // If your account supports USD, change currency to 'USD'
    const plan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: "Svay Neural Pro",
        amount: 999, // $9.99 -> 999 cents
        currency: "USD",
        description: "Unlimited access to content ecosystem intelligence"
      }
    });

    console.log("✓ Plan created successfully!");
    console.log("PLAN_ID:", plan.id);
    console.log("\nAdd this to your .env.local:");
    console.log(`NEXT_PUBLIC_RAZORPAY_PLAN_ID=${plan.id}`);
  } catch (error) {
    console.error("Error creating plan:", error);
    if (error.error?.description?.includes("supported")) {
        console.log("\nTrying with INR as fallback...");
        try {
            const plan = await razorpay.plans.create({
                period: "monthly",
                interval: 1,
                item: {
                  name: "Svay Neural Pro",
                  amount: 99900, // 999 INR -> 99900 paise
                  currency: "INR",
                  description: "Unlimited access to content ecosystem intelligence"
                }
            });
            console.log("✓ Plan created successfully (INR fallback)!");
            console.log("PLAN_ID:", plan.id);
            console.log("\nAdd this to your .env.local:");
            console.log(`NEXT_PUBLIC_RAZORPAY_PLAN_ID=${plan.id}`);
        } catch (innerError) {
            console.error("Fallback also failed:", innerError);
        }
    }
  }
}

setupPlan();
