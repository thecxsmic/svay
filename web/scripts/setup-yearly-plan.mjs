import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function setupYearlyPlan() {
  console.log("Setting up Razorpay Yearly Plan: 699/month (8,388 INR/year)...");

  try {
    const plan = await razorpay.plans.create({
      period: "yearly",
      interval: 1,
      item: {
        name: "Svay Neural Pro Yearly",
        amount: 838800, // 8388 INR -> 838800 paise
        currency: "INR",
        description: "Yearly subscription: 699/month (billed annually at 8,388)"
      }
    });

    console.log("✓ Yearly Plan created successfully!");
    console.log("PLAN_ID:", plan.id);
    console.log("\nAdd this to your .env file:");
    console.log(`NEXT_PUBLIC_RAZORPAY_YEARLY_PLAN_ID=${plan.id}`);
  } catch (error) {
    console.error("Error creating yearly plan:", error);
    if (error.error?.description?.includes("supported")) {
        console.log("\nTrying with USD as fallback...");
        try {
            const plan = await razorpay.plans.create({
                period: "yearly",
                interval: 1,
                item: {
                  name: "Svay Neural Pro Yearly",
                  amount: 8388, // $83.88 -> 8388 cents
                  currency: "USD",
                  description: "Yearly subscription: 699/month (billed annually at 83.88)"
                }
            });
            console.log("✓ Yearly Plan created successfully (USD fallback)!");
            console.log("PLAN_ID:", plan.id);
            console.log("\nAdd this to your .env file:");
            console.log(`NEXT_PUBLIC_RAZORPAY_YEARLY_PLAN_ID=${plan.id}`);
        } catch (innerError) {
            console.error("Fallback failed:", innerError);
        }
    }
  }
}

setupYearlyPlan();
