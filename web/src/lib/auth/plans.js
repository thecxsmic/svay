/**
 * Svay AppSumo Plan Feature Flags
 * ---------------------------------
 * Maps plan_id values (stored in user_subscriptions.plan_id) to feature permissions.
 *
 * AppSumo Lite  → plan_id starts with "appsumo_lite"
 * AppSumo Pro   → plan_id starts with "appsumo_pro"
 * Legacy promo  → plan_id starts with "promo_" or "admin_grant"
 * Razorpay/Dodo → plan_id is a product ID (full access)
 */

export const PLAN_FEATURES = {
  appsumo_lite: {
    tier: "lite",
    label: "AppSumo Lite",
    // Main YouTube keyword search (/search page) — fully locked for Lite
    canSearch: false,
    monthlySearches: 0,
    dailySearches: 0,
    // Competitor page: keyword search limit per day (0 = locked, number = capped)
    // @username / URL lookups bypass this limit entirely
    competitorDailyKeyword: 3,
    // Number of tracked (pinned) channels allowed
    trackedChannelLimit: 1,
  },

  appsumo_pro: {
    tier: "pro",
    label: "AppSumo Pro",
    canSearch: true,
    monthlySearches: 100,
    dailySearches: 20,
    competitorDailyKeyword: Infinity, // unlimited
    trackedChannelLimit: 10,
  },

  // Legacy promo codes and admin grants — full Pro access, no extra caps
  promo: {
    tier: "pro",
    label: "Promo",
    canSearch: true,
    monthlySearches: Infinity,
    dailySearches: Infinity,
    competitorDailyKeyword: Infinity,
    trackedChannelLimit: Infinity,
  },

  // Paid subscribers (Razorpay / Dodo product IDs) — full Pro access
  paid: {
    tier: "pro",
    label: "Pro",
    canSearch: true,
    monthlySearches: Infinity,
    dailySearches: Infinity,
    competitorDailyKeyword: Infinity,
    trackedChannelLimit: Infinity,
  },
};

/**
 * Derive the plan feature set from a planId string stored in the DB.
 *
 * @param {string|null|undefined} planId
 * @returns {typeof PLAN_FEATURES.paid}
 */
export function getPlanFeatures(planId) {
  if (!planId) return PLAN_FEATURES.paid; // fallback: full access (existing users)

  if (planId.startsWith("appsumo_lite")) return PLAN_FEATURES.appsumo_lite;
  if (planId.startsWith("appsumo_pro")) return PLAN_FEATURES.appsumo_pro;

  // Legacy promo codes and direct admin grants
  if (planId.startsWith("promo_") || planId.startsWith("admin_grant")) {
    return PLAN_FEATURES.promo;
  }

  // Paid Razorpay / Dodo product IDs — full access
  return PLAN_FEATURES.paid;
}

/**
 * Returns a display label for sidebar / billing page.
 * @param {string|null|undefined} planId
 * @param {boolean} isPromo  (existing isPromo flag from LayoutContent)
 */
export function getPlanLabel(planId, isPromo) {
  const features = getPlanFeatures(planId);
  if (features.tier === "lite") return "Lite";
  if (isPromo) return "Promo";
  return "Pro";
}
