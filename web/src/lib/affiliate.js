import { createClient } from "@libsql/client";
import crypto from "crypto";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

/**
 * Only commission plan: 'lifetime' — 10% forever, no expiry.
 */
export const COMMISSION_PLANS = {
  lifetime: { rate: 0.10, months: null, label: '10% lifetime' },
};

/** Defaults (kept for backward compat with existing rows). */
export const AFFILIATE_COMMISSION_RATE = 0.10;
export const AFFILIATE_COMMISSION_MONTHS = null;

/** Fallback amounts (cents) when webhook payload has no total. Matches public pricing. */
export const PLAN_AMOUNTS_CENTS = {
  monthly: 1499, // $14.99
  yearly: 11999, // $119.99
};

let schemaReady = false;

export async function ensureAffiliateSchema() {
  if (schemaReady) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS affiliates (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      display_name TEXT,
      email TEXT,
      paypal_email TEXT,
      status TEXT DEFAULT 'active',
      commission_rate REAL DEFAULT 0.15,
      commission_months INTEGER DEFAULT 6,
      commission_type TEXT DEFAULT 'boosted',
      created_at INTEGER,
      updated_at INTEGER
    )
  `);

  // Migrate: add commission_type if missing (idempotent)
  try {
    await db.execute(`ALTER TABLE affiliates ADD COLUMN commission_type TEXT DEFAULT 'boosted'`);
  } catch { /* column already exists */ }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_referrals (
      id TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL,
      referred_user_id TEXT UNIQUE NOT NULL,
      joined_at INTEGER NOT NULL,
      first_payment_at INTEGER,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (affiliate_id) REFERENCES affiliates (id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS affiliate_earnings (
      id TEXT PRIMARY KEY,
      affiliate_id TEXT NOT NULL,
      referral_id TEXT NOT NULL,
      referred_user_id TEXT NOT NULL,
      payment_id TEXT UNIQUE,
      subscription_id TEXT,
      plan_type TEXT,
      period_month TEXT NOT NULL,
      gross_cents INTEGER NOT NULL,
      commission_cents INTEGER NOT NULL,
      commission_rate REAL NOT NULL,
      payout_status TEXT DEFAULT 'unpaid',
      paid_at INTEGER,
      created_at INTEGER,
      FOREIGN KEY (affiliate_id) REFERENCES affiliates (id),
      FOREIGN KEY (referral_id) REFERENCES affiliate_referrals (id)
    )
  `);

  schemaReady = true;
}

export function normalizeAffiliateCode(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 24);
}

export function periodMonthFromUnix(unixSec = Math.floor(Date.now() / 1000)) {
  const d = new Date(unixSec * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthsBetween(fromUnix, toUnix) {
  if (!fromUnix || !toUnix) return 0;
  const from = new Date(fromUnix * 1000);
  const to = new Date(toUnix * 1000);
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth())
  );
}

/**
 * Whether a payment at `paidAt` is still inside the commission window
 * that starts at referral.joined_at.
 */
export function isWithinCommissionWindow(joinedAt, paidAt, commissionMonths) {
  const months = commissionMonths ?? AFFILIATE_COMMISSION_MONTHS;
  if (!joinedAt || !paidAt) return false;
  // Inclusive: month 0..months-1 → 6 months of eligibility
  return monthsBetween(joinedAt, paidAt) < months;
}

export function detectPlanType({ planType, productId, interval, amountCents }) {
  if (planType === "yearly" || planType === "monthly") return planType;
  if (interval === "Year" || interval === "year") return "yearly";
  if (interval === "Month" || interval === "month") return "monthly";

  const yearlyId = process.env.NEXT_PUBLIC_DODO_PAYMENTS_YEARLY_PRODUCT_ID;
  const monthlyId = process.env.NEXT_PUBLIC_DODO_PAYMENTS_MONTHLY_PRODUCT_ID;
  if (productId && yearlyId && productId === yearlyId) return "yearly";
  if (productId && monthlyId && productId === monthlyId) return "monthly";

  // Heuristic from amount
  if (typeof amountCents === "number" && amountCents >= 4000) return "yearly";
  return "monthly";
}

export async function getAffiliateByUserId(userId) {
  if (!userId) return null;
  await ensureAffiliateSchema();
  const rs = await db.execute({
    sql: "SELECT * FROM affiliates WHERE user_id = ?",
    args: [userId],
  });
  return rs.rows[0] || null;
}

export async function getAffiliateByCode(code) {
  const normalized = normalizeAffiliateCode(code);
  if (!normalized) return null;
  await ensureAffiliateSchema();
  const rs = await db.execute({
    sql: "SELECT * FROM affiliates WHERE code = ? AND status = 'active'",
    args: [normalized],
  });
  return rs.rows[0] || null;
}

export async function getAffiliateById(id) {
  if (!id) return null;
  await ensureAffiliateSchema();
  const rs = await db.execute({
    sql: "SELECT * FROM affiliates WHERE id = ?",
    args: [id],
  });
  return rs.rows[0] || null;
}

/**
 * Create or update an affiliate profile for a signed-in creator.
 */
export async function upsertAffiliateProfile({
  userId,
  email,
  displayName,
  paypalEmail,
  code: requestedCode,
  commissionType,
}) {
  await ensureAffiliateSchema();
  const now = Math.floor(Date.now() / 1000);
  const existing = await getAffiliateByUserId(userId);

  if (existing) {
    const paypal =
      typeof paypalEmail === "string" ? paypalEmail.trim() : existing.paypal_email;
    const name =
      typeof displayName === "string" && displayName.trim()
        ? displayName.trim()
        : existing.display_name;
    // Code is immutable after creation
    // Commission type can be changed before first referral payout
    const plan = COMMISSION_PLANS[commissionType];
    if (plan) {
      await db.execute({
        sql: `UPDATE affiliates
              SET paypal_email = ?, display_name = ?, email = COALESCE(?, email),
                  commission_rate = ?, commission_months = ?, commission_type = ?,
                  updated_at = ?
              WHERE id = ?`,
        args: [paypal || null, name || null, email || null,
               plan.rate, plan.months, commissionType, now, existing.id],
      });
    } else {
      await db.execute({
        sql: `UPDATE affiliates
              SET paypal_email = ?, display_name = ?, email = COALESCE(?, email), updated_at = ?
              WHERE id = ?`,
        args: [paypal || null, name || null, email || null, now, existing.id],
      });
    }
    return getAffiliateByUserId(userId);
  }

  let code = normalizeAffiliateCode(requestedCode);
  if (!code) {
    // Derive from email prefix or random
    const base = (email || userId || "CREATOR")
      .split("@")[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 10);
    code = `${base || "SVAY"}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  }

  // Ensure unique code
  for (let i = 0; i < 5; i++) {
    const clash = await db.execute({
      sql: "SELECT id FROM affiliates WHERE code = ?",
      args: [code],
    });
    if (clash.rows.length === 0) break;
    code = `${code.slice(0, 16)}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  }

  const plan = COMMISSION_PLANS[commissionType] || COMMISSION_PLANS.boosted;
  const chosenType = COMMISSION_PLANS[commissionType] ? commissionType : 'boosted';

  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO affiliates
            (id, user_id, code, display_name, email, paypal_email, status,
             commission_rate, commission_months, commission_type, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
    args: [
      id,
      userId,
      code,
      displayName?.trim() || null,
      email || null,
      paypalEmail?.trim() || null,
      plan.rate,
      plan.months,
      chosenType,
      now,
      now,
    ],
  });

  return getAffiliateByUserId(userId);
}

/**
 * Attribute a referred user to an affiliate (first-touch wins).
 */
export async function attributeReferral({
  affiliateCode,
  referredUserId,
  affiliateId: directAffiliateId,
}) {
  if (!referredUserId) return { ok: false, reason: "missing_user" };
  await ensureAffiliateSchema();

  // Already attributed?
  const existing = await db.execute({
    sql: "SELECT * FROM affiliate_referrals WHERE referred_user_id = ?",
    args: [referredUserId],
  });
  if (existing.rows.length > 0) {
    return { ok: true, already: true, referral: existing.rows[0] };
  }

  let affiliate = null;
  if (directAffiliateId) {
    affiliate = await getAffiliateById(directAffiliateId);
  } else if (affiliateCode) {
    affiliate = await getAffiliateByCode(affiliateCode);
  }

  if (!affiliate || affiliate.status !== "active") {
    return { ok: false, reason: "invalid_affiliate" };
  }

  // Don't let affiliates refer themselves
  if (affiliate.user_id === referredUserId) {
    return { ok: false, reason: "self_referral" };
  }

  const now = Math.floor(Date.now() / 1000);
  const id = crypto.randomUUID();
  await db.execute({
    sql: `INSERT INTO affiliate_referrals
            (id, affiliate_id, referred_user_id, joined_at, first_payment_at, status)
          VALUES (?, ?, ?, ?, NULL, 'active')`,
    args: [id, affiliate.id, referredUserId, now],
  });

  const rs = await db.execute({
    sql: "SELECT * FROM affiliate_referrals WHERE id = ?",
    args: [id],
  });

  return { ok: true, already: false, referral: rs.rows[0], affiliate };
}

/**
 * Record commission for a successful payment.
 * - Monthly: 15% each paid month while within 6 months of join
 * - Yearly: 15% of the yearly charge once (if paid within the window)
 */
export async function recordAffiliateEarningFromPayment({
  userId,
  paymentId,
  subscriptionId,
  productId,
  planType: rawPlanType,
  interval,
  amountCents: rawAmount,
  paidAt: rawPaidAt,
}) {
  if (!userId) return { ok: false, reason: "missing_user" };
  await ensureAffiliateSchema();

  const paidAt = rawPaidAt || Math.floor(Date.now() / 1000);

  // Dedup by payment id
  if (paymentId) {
    const dup = await db.execute({
      sql: "SELECT id FROM affiliate_earnings WHERE payment_id = ?",
      args: [paymentId],
    });
    if (dup.rows.length > 0) {
      return { ok: true, already: true, earningId: dup.rows[0].id };
    }
  }

  const refRs = await db.execute({
    sql: `SELECT r.*, a.commission_rate, a.commission_months, a.commission_type,
                 a.status AS affiliate_status
          FROM affiliate_referrals r
          JOIN affiliates a ON a.id = r.affiliate_id
          WHERE r.referred_user_id = ? AND r.status = 'active'`,
    args: [userId],
  });

  if (refRs.rows.length === 0) {
    return { ok: false, reason: "no_referral" };
  }

  const referral = refRs.rows[0];
  if (referral.affiliate_status !== "active") {
    return { ok: false, reason: "affiliate_inactive" };
  }

  const commissionType = referral.commission_type || 'boosted';
  const isLifetime = commissionType === 'lifetime';
  const commissionMonths =
    referral.commission_months ?? AFFILIATE_COMMISSION_MONTHS;
  const commissionRate =
    typeof referral.commission_rate === "number"
      ? referral.commission_rate
      : AFFILIATE_COMMISSION_RATE;

  // Lifetime affiliates always earn — no time window check
  if (!isLifetime && !isWithinCommissionWindow(referral.joined_at, paidAt, commissionMonths)) {
    return { ok: false, reason: "outside_window" };
  }

  // Explicit $0 (trial start / free period) — never invent a commission
  if (rawAmount === 0) {
    return { ok: false, reason: "zero_payment" };
  }

  let amountCents =
    typeof rawAmount === "number" && rawAmount > 0 ? Math.round(rawAmount) : null;

  const planType = detectPlanType({
    planType: rawPlanType,
    productId,
    interval,
    amountCents,
  });

  // Fallback only when webhook omitted amount (not when amount was zero)
  if (amountCents == null) {
    amountCents = PLAN_AMOUNTS_CENTS[planType] || PLAN_AMOUNTS_CENTS.monthly;
  }

  // Yearly is a one-time commission per subscription payment (the annual charge).
  // Monthly is recurring each payment.succeeded within the window.
  // For yearly, also guard against double-crediting the same sub in the same window
  // if payment_id is missing.
  if (planType === "yearly" && subscriptionId) {
    const yearlyDup = await db.execute({
      sql: `SELECT id FROM affiliate_earnings
            WHERE referred_user_id = ? AND subscription_id = ? AND plan_type = 'yearly'`,
      args: [userId, subscriptionId],
    });
    if (yearlyDup.rows.length > 0) {
      return { ok: true, already: true, earningId: yearlyDup.rows[0].id };
    }
  }

  const commissionCents = Math.round(amountCents * commissionRate);
  if (commissionCents <= 0) {
    return { ok: false, reason: "zero_commission" };
  }

  const id = crypto.randomUUID();
  const periodMonth = periodMonthFromUnix(paidAt);

  await db.execute({
    sql: `INSERT INTO affiliate_earnings
            (id, affiliate_id, referral_id, referred_user_id, payment_id, subscription_id,
             plan_type, period_month, gross_cents, commission_cents, commission_rate,
             payout_status, paid_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', NULL, ?)`,
    args: [
      id,
      referral.affiliate_id,
      referral.id,
      userId,
      paymentId || null,
      subscriptionId || null,
      planType,
      periodMonth,
      amountCents,
      commissionCents,
      commissionRate,
      paidAt,
    ],
  });

  if (!referral.first_payment_at) {
    await db.execute({
      sql: "UPDATE affiliate_referrals SET first_payment_at = ? WHERE id = ?",
      args: [paidAt, referral.id],
    });
  }

  return {
    ok: true,
    already: false,
    earningId: id,
    commissionCents,
    planType,
    periodMonth,
  };
}

export async function getAffiliateDashboard(userId) {
  await ensureAffiliateSchema();
  const affiliate = await getAffiliateByUserId(userId);
  if (!affiliate) return null;

  const now = Math.floor(Date.now() / 1000);
  const currentMonth = periodMonthFromUnix(now);

  const refs = await db.execute({
    sql: `SELECT r.*,
            s.status AS sub_status,
            s.plan_id AS sub_plan_id,
            s.current_period_end AS sub_period_end,
            s.subscription_id AS sub_id
          FROM affiliate_referrals r
          LEFT JOIN user_subscriptions s ON s.user_id = r.referred_user_id
          WHERE r.affiliate_id = ?
          ORDER BY r.joined_at DESC`,
    args: [affiliate.id],
  });

  const earnings = await db.execute({
    sql: `SELECT * FROM affiliate_earnings
          WHERE affiliate_id = ?
          ORDER BY created_at DESC
          LIMIT 200`,
    args: [affiliate.id],
  });

  const monthly = await db.execute({
    sql: `SELECT period_month,
            SUM(commission_cents) AS commission_cents,
            SUM(gross_cents) AS gross_cents,
            COUNT(*) AS payment_count,
            SUM(CASE WHEN payout_status = 'unpaid' THEN commission_cents ELSE 0 END) AS unpaid_cents,
            SUM(CASE WHEN payout_status = 'paid' THEN commission_cents ELSE 0 END) AS paid_cents
          FROM affiliate_earnings
          WHERE affiliate_id = ?
          GROUP BY period_month
          ORDER BY period_month DESC`,
    args: [affiliate.id],
  });

  const totals = await db.execute({
    sql: `SELECT
            COALESCE(SUM(commission_cents), 0) AS total_commission_cents,
            COALESCE(SUM(CASE WHEN payout_status = 'unpaid' THEN commission_cents ELSE 0 END), 0) AS unpaid_cents,
            COALESCE(SUM(CASE WHEN payout_status = 'paid' THEN commission_cents ELSE 0 END), 0) AS paid_cents,
            COALESCE(SUM(CASE WHEN period_month = ? THEN commission_cents ELSE 0 END), 0) AS this_month_cents,
            COUNT(*) AS earning_rows
          FROM affiliate_earnings
          WHERE affiliate_id = ?`,
    args: [currentMonth, affiliate.id],
  });

  const referred = refs.rows.map((r) => {
    const activeStatuses = ["active", "authenticated", "created", "pending"];
    const grace = 2 * 24 * 60 * 60;
    const periodOk =
      !r.sub_period_end || r.sub_period_end + grace > now;
    const isActive =
      activeStatuses.includes(r.sub_status) && periodOk;
    const planLabel = r.sub_plan_id
      ? r.sub_plan_id.includes("year") ||
        (process.env.NEXT_PUBLIC_DODO_PAYMENTS_YEARLY_PRODUCT_ID &&
          r.sub_plan_id === process.env.NEXT_PUBLIC_DODO_PAYMENTS_YEARLY_PRODUCT_ID)
        ? "yearly"
        : r.sub_plan_id.startsWith("promo_") || r.sub_plan_id.startsWith("admin_grant")
          ? "promo"
          : "monthly"
      : null;

    const isLifetime = (affiliate.commission_type || 'boosted') === 'lifetime';
    const windowOpen = isLifetime || isWithinCommissionWindow(
      r.joined_at,
      now,
      affiliate.commission_months ?? AFFILIATE_COMMISSION_MONTHS
    );

    return {
      id: r.id,
      userId: r.referred_user_id,
      joinedAt: r.joined_at,
      firstPaymentAt: r.first_payment_at,
      isActive,
      planType: planLabel,
      subscriptionStatus: r.sub_status || null,
      commissionWindowOpen: windowOpen,
    };
  });

  const t = totals.rows[0] || {};

  return {
    affiliate: {
      id: affiliate.id,
      code: affiliate.code,
      displayName: affiliate.display_name,
      email: affiliate.email,
      paypalEmail: affiliate.paypal_email,
      status: affiliate.status,
      commissionRate: affiliate.commission_rate ?? AFFILIATE_COMMISSION_RATE,
      commissionMonths: affiliate.commission_months ?? AFFILIATE_COMMISSION_MONTHS,
      commissionType: affiliate.commission_type || 'boosted',
      createdAt: affiliate.created_at,
    },
    stats: {
      totalReferrals: referred.length,
      activeReferrals: referred.filter((r) => r.isActive).length,
      totalCommissionCents: Number(t.total_commission_cents || 0),
      unpaidCents: Number(t.unpaid_cents || 0),
      paidCents: Number(t.paid_cents || 0),
      thisMonthCents: Number(t.this_month_cents || 0),
      currentMonth,
    },
    monthly: monthly.rows.map((m) => ({
      periodMonth: m.period_month,
      commissionCents: Number(m.commission_cents || 0),
      grossCents: Number(m.gross_cents || 0),
      paymentCount: Number(m.payment_count || 0),
      unpaidCents: Number(m.unpaid_cents || 0),
      paidCents: Number(m.paid_cents || 0),
    })),
    referrals: referred,
    earnings: earnings.rows.map((e) => ({
      id: e.id,
      planType: e.plan_type,
      periodMonth: e.period_month,
      grossCents: e.gross_cents,
      commissionCents: e.commission_cents,
      payoutStatus: e.payout_status,
      paidAt: e.paid_at,
      createdAt: e.created_at,
      paymentId: e.payment_id,
    })),
  };
}

/**
 * Admin: monthly payout rollup per affiliate (PayPal email + amount).
 */
export async function getAdminMonthlyPayouts(periodMonth) {
  await ensureAffiliateSchema();
  const month = periodMonth || periodMonthFromUnix();

  const rs = await db.execute({
    sql: `SELECT
            a.id AS affiliate_id,
            a.code,
            a.display_name,
            a.email,
            a.paypal_email,
            a.status AS affiliate_status,
            a.user_id,
            COALESCE(SUM(e.commission_cents), 0) AS commission_cents,
            COALESCE(SUM(e.gross_cents), 0) AS gross_cents,
            COALESCE(SUM(CASE WHEN e.payout_status = 'unpaid' THEN e.commission_cents ELSE 0 END), 0) AS unpaid_cents,
            COALESCE(SUM(CASE WHEN e.payout_status = 'paid' THEN e.commission_cents ELSE 0 END), 0) AS paid_cents,
            COUNT(e.id) AS payment_count,
            SUM(CASE WHEN e.plan_type = 'monthly' THEN 1 ELSE 0 END) AS monthly_payments,
            SUM(CASE WHEN e.plan_type = 'yearly' THEN 1 ELSE 0 END) AS yearly_payments
          FROM affiliates a
          LEFT JOIN affiliate_earnings e
            ON e.affiliate_id = a.id AND e.period_month = ?
          GROUP BY a.id
          ORDER BY unpaid_cents DESC, a.created_at DESC`,
    args: [month],
  });

  const detail = await db.execute({
    sql: `SELECT e.*, a.code AS affiliate_code, a.paypal_email, a.display_name
          FROM affiliate_earnings e
          JOIN affiliates a ON a.id = e.affiliate_id
          WHERE e.period_month = ?
          ORDER BY e.created_at DESC`,
    args: [month],
  });

  const creators = rs.rows.map((row) => ({
    affiliateId: row.affiliate_id,
    code: row.code,
    displayName: row.display_name,
    email: row.email,
    paypalEmail: row.paypal_email,
    status: row.affiliate_status,
    userId: row.user_id,
    commissionCents: Number(row.commission_cents || 0),
    grossCents: Number(row.gross_cents || 0),
    unpaidCents: Number(row.unpaid_cents || 0),
    paidCents: Number(row.paid_cents || 0),
    paymentCount: Number(row.payment_count || 0),
    monthlyPayments: Number(row.monthly_payments || 0),
    yearlyPayments: Number(row.yearly_payments || 0),
  }));

  const totalUnpaid = creators.reduce((s, c) => s + c.unpaidCents, 0);
  const totalCommission = creators.reduce((s, c) => s + c.commissionCents, 0);

  return {
    periodMonth: month,
    totalUnpaidCents: totalUnpaid,
    totalCommissionCents: totalCommission,
    creators,
    earnings: detail.rows.map((e) => ({
      id: e.id,
      affiliateId: e.affiliate_id,
      affiliateCode: e.affiliate_code,
      paypalEmail: e.paypal_email,
      displayName: e.display_name,
      referredUserId: e.referred_user_id,
      planType: e.plan_type,
      grossCents: e.gross_cents,
      commissionCents: e.commission_cents,
      payoutStatus: e.payout_status,
      paidAt: e.paid_at,
      createdAt: e.created_at,
      paymentId: e.payment_id,
    })),
  };
}

export async function listAllAffiliates() {
  await ensureAffiliateSchema();
  const rs = await db.execute(
    `SELECT a.*,
       (SELECT COUNT(*) FROM affiliate_referrals r WHERE r.affiliate_id = a.id) AS referral_count,
       (SELECT COALESCE(SUM(commission_cents), 0) FROM affiliate_earnings e WHERE e.affiliate_id = a.id) AS total_commission_cents,
       (SELECT COALESCE(SUM(commission_cents), 0) FROM affiliate_earnings e WHERE e.affiliate_id = a.id AND e.payout_status = 'unpaid') AS unpaid_cents
     FROM affiliates a
     ORDER BY a.created_at DESC`
  );
  return rs.rows.map((a) => ({
    id: a.id,
    userId: a.user_id,
    code: a.code,
    displayName: a.display_name,
    email: a.email,
    paypalEmail: a.paypal_email,
    status: a.status,
    commissionRate: a.commission_rate,
    commissionMonths: a.commission_months,
    createdAt: a.created_at,
    referralCount: Number(a.referral_count || 0),
    totalCommissionCents: Number(a.total_commission_cents || 0),
    unpaidCents: Number(a.unpaid_cents || 0),
  }));
}

export async function setAffiliateStatus(affiliateId, status) {
  await ensureAffiliateSchema();
  if (!["active", "disabled", "pending"].includes(status)) {
    throw new Error("Invalid status");
  }
  const now = Math.floor(Date.now() / 1000);
  await db.execute({
    sql: "UPDATE affiliates SET status = ?, updated_at = ? WHERE id = ?",
    args: [status, now, affiliateId],
  });
}

/**
 * Mark all unpaid earnings for an affiliate in a given month as paid.
 */
export async function markMonthPaid({ affiliateId, periodMonth }) {
  await ensureAffiliateSchema();
  const now = Math.floor(Date.now() / 1000);
  const result = await db.execute({
    sql: `UPDATE affiliate_earnings
          SET payout_status = 'paid', paid_at = ?
          WHERE affiliate_id = ? AND period_month = ? AND payout_status = 'unpaid'`,
    args: [now, affiliateId, periodMonth],
  });
  return { rowsAffected: result.rowsAffected || 0, paidAt: now };
}

export async function adminUpdateAffiliate({
  affiliateId,
  paypalEmail,
  displayName,
  status,
}) {
  await ensureAffiliateSchema();
  const now = Math.floor(Date.now() / 1000);
  const current = await getAffiliateById(affiliateId);
  if (!current) throw new Error("Affiliate not found");

  await db.execute({
    sql: `UPDATE affiliates SET
            paypal_email = ?,
            display_name = ?,
            status = ?,
            updated_at = ?
          WHERE id = ?`,
    args: [
      paypalEmail !== undefined ? paypalEmail : current.paypal_email,
      displayName !== undefined ? displayName : current.display_name,
      status || current.status,
      now,
      affiliateId,
    ],
  });
  return getAffiliateById(affiliateId);
}

export function centsToUsd(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}
