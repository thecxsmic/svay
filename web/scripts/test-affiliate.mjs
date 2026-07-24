/**
 * Local integration test for the affiliate program.
 * Uses live Turso (from .env) with isolated test IDs, then cleans up.
 *
 * Run: node scripts/test-affiliate.mjs
 */
import "dotenv/config";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Dynamic import after env is loaded — affiliate.js creates client at module scope
const {
  ensureAffiliateSchema,
  upsertAffiliateProfile,
  attributeReferral,
  recordAffiliateEarningFromPayment,
  getAffiliateDashboard,
  getAdminMonthlyPayouts,
  markMonthPaid,
  setAffiliateStatus,
  isWithinCommissionWindow,
  monthsBetween,
  periodMonthFromUnix,
  normalizeAffiliateCode,
  detectPlanType,
  centsToUsd,
  AFFILIATE_COMMISSION_RATE,
  AFFILIATE_COMMISSION_MONTHS,
  PLAN_AMOUNTS_CENTS,
} = await import("../src/lib/affiliate.js");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

const RUN = crypto.randomBytes(4).toString("hex");
const AFF_USER = `user_aff_test_${RUN}`;
const REF_USER_A = `user_ref_a_${RUN}`;
const REF_USER_B = `user_ref_b_${RUN}`;
const CODE = `TEST${RUN.toUpperCase()}`.slice(0, 20);

let passed = 0;
let failed = 0;
const failures = [];

function assert(cond, name, detail = "") {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    failures.push(name + (detail ? ` — ${detail}` : ""));
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function cleanup() {
  // Delete by affiliate user / code / referred users from this run
  try {
    const aff = await db.execute({
      sql: "SELECT id FROM affiliates WHERE user_id = ? OR code = ?",
      args: [AFF_USER, CODE],
    });
    for (const row of aff.rows) {
      await db.execute({
        sql: "DELETE FROM affiliate_earnings WHERE affiliate_id = ?",
        args: [row.id],
      });
      await db.execute({
        sql: "DELETE FROM affiliate_referrals WHERE affiliate_id = ?",
        args: [row.id],
      });
      await db.execute({
        sql: "DELETE FROM affiliates WHERE id = ?",
        args: [row.id],
      });
    }
    // orphan referrals/earnings by referred user
    await db.execute({
      sql: "DELETE FROM affiliate_earnings WHERE referred_user_id IN (?, ?)",
      args: [REF_USER_A, REF_USER_B],
    });
    await db.execute({
      sql: "DELETE FROM affiliate_referrals WHERE referred_user_id IN (?, ?)",
      args: [REF_USER_A, REF_USER_B],
    });
  } catch (e) {
    console.warn("Cleanup warning:", e.message);
  }
}

async function main() {
  console.log("\n=== Affiliate local test suite ===");
  console.log(`Run id: ${RUN}`);
  console.log(`Code:   ${CODE}`);
  console.log(`DB:     ${process.env.TURSO_DATABASE_URL ? "configured" : "MISSING"}\n`);

  if (!process.env.TURSO_DATABASE_URL) {
    console.error("TURSO_DATABASE_URL not set — aborting");
    process.exit(1);
  }

  await cleanup();

  // --- Unit helpers ---
  console.log("1) Pure helpers");
  assert(normalizeAffiliateCode("  my-code!@# ") === "MY-CODE", "normalize code");
  assert(AFFILIATE_COMMISSION_RATE === 0.15, "default rate 15%");
  assert(AFFILIATE_COMMISSION_MONTHS === 6, "default window 6 months");
  assert(detectPlanType({ planType: "yearly" }) === "yearly", "detect yearly plan");
  assert(detectPlanType({ planType: "monthly" }) === "monthly", "detect monthly plan");
  assert(detectPlanType({ amountCents: 7999 }) === "yearly", "detect yearly by amount");
  assert(detectPlanType({ amountCents: 999 }) === "monthly", "detect monthly by amount");
  assert(centsToUsd(150) === "1.50", "cents to USD");

  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  assert(isWithinCommissionWindow(now - 30 * day, now, 6) === true, "window open at 1 month");
  assert(isWithinCommissionWindow(now - 200 * day, now, 6) === false, "window closed after ~6+ months");
  assert(monthsBetween(now - 90 * day, now) >= 2, "monthsBetween roughly works");

  // --- Schema ---
  console.log("\n2) Schema ensure");
  await ensureAffiliateSchema();
  assert(true, "ensureAffiliateSchema() ok");

  // --- Enroll affiliate ---
  console.log("\n3) Enroll creator");
  const affiliate = await upsertAffiliateProfile({
    userId: AFF_USER,
    email: `creator_${RUN}@test.svay.space`,
    displayName: `Test Creator ${RUN}`,
    paypalEmail: `paypal_${RUN}@example.com`,
    code: CODE,
  });
  assert(!!affiliate?.id, "affiliate created", JSON.stringify(affiliate));
  assert(affiliate.code === CODE, "code stored");
  assert(affiliate.paypal_email === `paypal_${RUN}@example.com`, "paypal stored");
  assert(Number(affiliate.commission_rate) === 0.15, "commission rate 0.15");
  assert(Number(affiliate.commission_months) === 6, "commission months 6");
  assert(affiliate.status === "active", "status active");

  // Update paypal only
  const updated = await upsertAffiliateProfile({
    userId: AFF_USER,
    email: `creator_${RUN}@test.svay.space`,
    displayName: `Test Creator ${RUN}`,
    paypalEmail: `newpaypal_${RUN}@example.com`,
  });
  assert(
    updated.paypal_email === `newpaypal_${RUN}@example.com`,
    "paypal update works"
  );
  assert(updated.code === CODE, "code immutable on update");

  // --- Attribution ---
  console.log("\n4) Referral attribution");
  const attrA = await attributeReferral({
    affiliateCode: CODE,
    referredUserId: REF_USER_A,
  });
  assert(attrA.ok === true, "attribute user A");
  assert(attrA.already === false, "first touch for A");

  const attrA2 = await attributeReferral({
    affiliateCode: CODE,
    referredUserId: REF_USER_A,
  });
  assert(attrA2.ok === true && attrA2.already === true, "first-touch wins (no re-attribute)");

  const selfRef = await attributeReferral({
    affiliateCode: CODE,
    referredUserId: AFF_USER,
  });
  assert(selfRef.ok === false && selfRef.reason === "self_referral", "block self-referral");

  const badCode = await attributeReferral({
    affiliateCode: "NOPE_DOES_NOT_EXIST_ZZ",
    referredUserId: REF_USER_B,
  });
  assert(badCode.ok === false, "reject invalid code");

  const attrB = await attributeReferral({
    affiliateCode: CODE,
    referredUserId: REF_USER_B,
  });
  assert(attrB.ok === true, "attribute user B");

  // --- Monthly commission ---
  console.log("\n5) Monthly commission (15%)");
  const payId1 = `pay_mo_${RUN}_1`;
  const earnMo = await recordAffiliateEarningFromPayment({
    userId: REF_USER_A,
    paymentId: payId1,
    subscriptionId: `sub_mo_${RUN}`,
    planType: "monthly",
    amountCents: 999,
    paidAt: now,
  });
  assert(earnMo.ok === true, "monthly earning recorded", JSON.stringify(earnMo));
  assert(earnMo.commissionCents === Math.round(999 * 0.15), `commission = 15% of 999 (=${Math.round(999 * 0.15)})`, `got ${earnMo.commissionCents}`);
  assert(earnMo.planType === "monthly", "plan_type monthly");

  // Dedup same payment
  const earnMoDup = await recordAffiliateEarningFromPayment({
    userId: REF_USER_A,
    paymentId: payId1,
    subscriptionId: `sub_mo_${RUN}`,
    planType: "monthly",
    amountCents: 999,
    paidAt: now,
  });
  assert(earnMoDup.ok === true && earnMoDup.already === true, "dedup same payment_id");

  // Second month payment (still in window)
  const payId2 = `pay_mo_${RUN}_2`;
  const earnMo2 = await recordAffiliateEarningFromPayment({
    userId: REF_USER_A,
    paymentId: payId2,
    subscriptionId: `sub_mo_${RUN}`,
    planType: "monthly",
    amountCents: 999,
    paidAt: now + 1, // same month ok for test
  });
  assert(earnMo2.ok === true && !earnMo2.already, "second monthly payment credits again");

  // Zero payment (trial)
  const zeroEarn = await recordAffiliateEarningFromPayment({
    userId: REF_USER_A,
    paymentId: `pay_zero_${RUN}`,
    planType: "monthly",
    amountCents: 0,
    paidAt: now,
  });
  assert(zeroEarn.ok === false && zeroEarn.reason === "zero_payment", "skip $0 trial charges");

  // Outside window
  const oldJoin = now - 400 * day;
  await db.execute({
    sql: "UPDATE affiliate_referrals SET joined_at = ? WHERE referred_user_id = ?",
    args: [oldJoin, REF_USER_A],
  });
  const outside = await recordAffiliateEarningFromPayment({
    userId: REF_USER_A,
    paymentId: `pay_out_${RUN}`,
    planType: "monthly",
    amountCents: 999,
    paidAt: now,
  });
  assert(outside.ok === false && outside.reason === "outside_window", "no commission after 6 months");
  // restore join for remaining tests
  await db.execute({
    sql: "UPDATE affiliate_referrals SET joined_at = ? WHERE referred_user_id = ?",
    args: [now - day, REF_USER_A],
  });

  // --- Yearly one-time ---
  console.log("\n6) Yearly one-time commission");
  const payYear = `pay_yr_${RUN}`;
  const subYear = `sub_yr_${RUN}`;
  const earnYr = await recordAffiliateEarningFromPayment({
    userId: REF_USER_B,
    paymentId: payYear,
    subscriptionId: subYear,
    planType: "yearly",
    amountCents: 7999,
    paidAt: now,
  });
  assert(earnYr.ok === true, "yearly earning recorded");
  assert(
    earnYr.commissionCents === Math.round(7999 * 0.15),
    `yearly 15% of 7999 (=${Math.round(7999 * 0.15)})`,
    `got ${earnYr.commissionCents}`
  );
  assert(earnYr.planType === "yearly", "plan_type yearly");

  // Same yearly sub shouldn't double-pay even with new payment id missing uniqueness path
  const earnYrDup = await recordAffiliateEarningFromPayment({
    userId: REF_USER_B,
    paymentId: `pay_yr_${RUN}_again`,
    subscriptionId: subYear,
    planType: "yearly",
    amountCents: 7999,
    paidAt: now,
  });
  assert(
    earnYrDup.ok === true && earnYrDup.already === true,
    "yearly one-time: no double credit same subscription"
  );

  // --- Dashboard ---
  console.log("\n7) Creator dashboard");
  const dash = await getAffiliateDashboard(AFF_USER);
  assert(!!dash, "dashboard loads");
  assert(dash.affiliate.code === CODE, "dashboard code");
  assert(dash.stats.totalReferrals === 2, `2 referrals (got ${dash.stats.totalReferrals})`);
  assert(dash.stats.totalCommissionCents > 0, "total commission > 0");
  // 2 monthly * 150 + 1 yearly * 1200 = 300 + 1200 = 1500
  const expected =
    Math.round(999 * 0.15) * 2 + Math.round(7999 * 0.15);
  assert(
    dash.stats.totalCommissionCents === expected,
    `total commission cents === ${expected}`,
    `got ${dash.stats.totalCommissionCents}`
  );
  assert(dash.stats.unpaidCents === expected, "all unpaid initially");
  assert((dash.monthly || []).length >= 1, "monthly rollup present");
  assert((dash.earnings || []).length === 3, `3 earning rows (got ${dash.earnings?.length})`);

  // --- Admin monthly payouts ---
  console.log("\n8) Admin monthly payout report");
  const month = periodMonthFromUnix(now);
  const payouts = await getAdminMonthlyPayouts(month);
  assert(payouts.periodMonth === month, "payout month");
  const creator = payouts.creators.find((c) => c.code === CODE);
  assert(!!creator, "creator in payout list");
  assert(
    creator.paypalEmail === `newpaypal_${RUN}@example.com`,
    "admin sees PayPal email"
  );
  assert(creator.unpaidCents === expected, `unpaid ${expected}`, `got ${creator.unpaidCents}`);
  assert(creator.monthlyPayments === 2, "2 monthly payment line items");
  assert(creator.yearlyPayments === 1, "1 yearly payment line item");
  assert(
    payouts.earnings.some((e) => e.affiliateCode === CODE && e.planType === "yearly"),
    "line items include yearly"
  );

  // --- Mark paid ---
  console.log("\n9) Mark month paid");
  const mark = await markMonthPaid({
    affiliateId: affiliate.id,
    periodMonth: month,
  });
  assert(mark.rowsAffected >= 3, `marked >=3 rows (got ${mark.rowsAffected})`);

  const dash2 = await getAffiliateDashboard(AFF_USER);
  assert(dash2.stats.unpaidCents === 0, "unpaid becomes 0 after mark paid");
  assert(dash2.stats.paidCents === expected, "paid cents match total");

  const payouts2 = await getAdminMonthlyPayouts(month);
  const creator2 = payouts2.creators.find((c) => c.code === CODE);
  assert(creator2.unpaidCents === 0, "admin unpaid 0 after mark paid");
  assert(creator2.paidCents === expected, "admin paid cents set");

  // --- Disable affiliate ---
  console.log("\n10) Disable affiliate");
  await setAffiliateStatus(affiliate.id, "disabled");
  const attrWhileDisabled = await attributeReferral({
    affiliateCode: CODE,
    referredUserId: `user_ref_c_${RUN}`,
  });
  assert(
    attrWhileDisabled.ok === false,
    "disabled affiliate cannot receive new referrals"
  );
  await setAffiliateStatus(affiliate.id, "active");

  // --- No referral earning ---
  console.log("\n11) Edge: payment with no referral");
  const noRef = await recordAffiliateEarningFromPayment({
    userId: `user_nobody_${RUN}`,
    paymentId: `pay_nobody_${RUN}`,
    planType: "monthly",
    amountCents: 999,
    paidAt: now,
  });
  assert(noRef.ok === false && noRef.reason === "no_referral", "skip non-referred users");

  // --- Cleanup ---
  console.log("\n12) Cleanup test data");
  await cleanup();
  const gone = await db.execute({
    sql: "SELECT id FROM affiliates WHERE code = ?",
    args: [CODE],
  });
  assert(gone.rows.length === 0, "test affiliate removed");

  // --- Summary ---
  console.log("\n================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log("Failures:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  console.log("================================\n");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  cleanup().finally(() => process.exit(1));
});
