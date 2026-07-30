import { auth } from "@clerk/nextjs/server";
import { parseFilters } from "@/lib/youtube/filters";
import { searchPipeline } from "@/lib/search/pipeline";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode, generateMockSearch } from "@/lib/utils/demoMock";
import { getSubscriptionStatus } from "@/lib/auth/subscription";
import { getPlanFeatures } from "@/lib/auth/plans";
import { checkRateLimit } from "@/lib/rateLimit";
import { getMonthlySearchCount, incrementMonthlySearchCount } from "@/lib/cache/turso";

export async function GET(req) {
  try {
    const filters = parseFilters(req);

    if (!filters.query) {
      return apiError(new Error("Query parameter 'q' is required"), 400);
    }

    if (await getIsDemoMode()) {
      const items = generateMockSearch(filters.query);
      return apiSuccess({ items, nextPageToken: null });
    }

    // ── Plan enforcement ────────────────────────────────────────────────────
    const { userId } = await auth();
    if (userId) {
      const sub = await getSubscriptionStatus(userId);
      const plan = getPlanFeatures(sub?.planId);

      // Lite tier: search is fully locked
      if (!plan.canSearch) {
        return apiError(
          Object.assign(
            new Error("Live search is not available on the Lite plan. Upgrade to Pro for 100 searches/month."),
            { planLocked: true, tier: "lite" }
          ),
          403
        );
      }

      // Pro tier: enforce monthly cap (Turso counter) then daily cap (in-memory)
      if (isFinite(plan.monthlySearches)) {
        const monthlyCount = await getMonthlySearchCount(userId);
        if (monthlyCount >= plan.monthlySearches) {
          return apiError(
            Object.assign(
              new Error(`Monthly search limit reached (${plan.monthlySearches}/mo). Resets on the 1st of next month.`),
              { planLocked: true, tier: "pro", limitType: "monthly" }
            ),
            429
          );
        }
      }

      if (isFinite(plan.dailySearches)) {
        const rl = checkRateLimit(`search:${userId}`, plan.dailySearches, 24 * 60 * 60 * 1000);
        if (rl.limited) {
          return apiError(
            Object.assign(
              new Error(`Daily search limit reached (${plan.dailySearches}/day). Resets in ${Math.ceil((rl.reset - Date.now()) / 3600000)}h.`),
              { planLocked: true, tier: "pro", limitType: "daily" }
            ),
            429
          );
        }
      }

      // Increment counter after all checks pass
      if (isFinite(plan.monthlySearches)) {
        incrementMonthlySearchCount(userId).catch(() => {});
      }
    }
    // ── End plan enforcement ────────────────────────────────────────────────

    const { items, nextPageToken } = await searchPipeline(filters);

    return apiSuccess({ items, nextPageToken });
  } catch (error) {
    return apiError(error);
  }
}
