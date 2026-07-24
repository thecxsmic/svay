import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  listAllAffiliates,
  getAdminMonthlyPayouts,
  markMonthPaid,
  adminUpdateAffiliate,
  setAffiliateStatus,
  periodMonthFromUnix,
  centsToUsd,
} from "@/lib/affiliate";

async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) return { authorized: false, error: "Unauthorized", status: 401 };

  try {
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    if (userEmail !== "thecxsmic@gmail.com") {
      return { authorized: false, error: "Forbidden", status: 403 };
    }
    return { authorized: true, userId, email: userEmail };
  } catch (e) {
    console.error("[Admin Affiliates] auth failed:", e);
    return { authorized: false, error: "Authentication failed", status: 500 };
  }
}

/**
 * GET ?view=payouts&month=YYYY-MM  → monthly PayPal payout report
 * GET ?view=list                   → all affiliates
 * GET (default)                    → both list + current month payouts
 */
export async function GET(req) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") || "all";
    const month =
      searchParams.get("month") || periodMonthFromUnix();

    if (view === "list") {
      const affiliates = await listAllAffiliates();
      return NextResponse.json({ affiliates });
    }

    if (view === "payouts") {
      const payouts = await getAdminMonthlyPayouts(month);
      return NextResponse.json({
        ...payouts,
        totalUnpaidUsd: centsToUsd(payouts.totalUnpaidCents),
        totalCommissionUsd: centsToUsd(payouts.totalCommissionCents),
      });
    }

    const [affiliates, payouts] = await Promise.all([
      listAllAffiliates(),
      getAdminMonthlyPayouts(month),
    ]);

    return NextResponse.json({
      affiliates,
      payouts: {
        ...payouts,
        totalUnpaidUsd: centsToUsd(payouts.totalUnpaidCents),
        totalCommissionUsd: centsToUsd(payouts.totalCommissionCents),
      },
    });
  } catch (error) {
    console.error("[Admin Affiliates] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliate data" },
      { status: 500 }
    );
  }
}

/**
 * POST actions:
 *  - mark_paid: { action, affiliateId, periodMonth }
 *  - update: { action, affiliateId, paypalEmail?, displayName?, status? }
 *  - set_status: { action, affiliateId, status }
 */
export async function POST(req) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "mark_paid") {
      const { affiliateId, periodMonth } = body;
      if (!affiliateId || !periodMonth) {
        return NextResponse.json(
          { error: "affiliateId and periodMonth are required" },
          { status: 400 }
        );
      }
      const result = await markMonthPaid({ affiliateId, periodMonth });
      return NextResponse.json({
        success: true,
        message: `Marked ${result.rowsAffected} earning(s) as paid for ${periodMonth}.`,
        ...result,
      });
    }

    if (action === "update") {
      const { affiliateId, paypalEmail, displayName, status } = body;
      if (!affiliateId) {
        return NextResponse.json(
          { error: "affiliateId is required" },
          { status: 400 }
        );
      }
      const affiliate = await adminUpdateAffiliate({
        affiliateId,
        paypalEmail,
        displayName,
        status,
      });
      return NextResponse.json({ success: true, affiliate });
    }

    if (action === "set_status") {
      const { affiliateId, status } = body;
      if (!affiliateId || !status) {
        return NextResponse.json(
          { error: "affiliateId and status are required" },
          { status: 400 }
        );
      }
      await setAffiliateStatus(affiliateId, status);
      return NextResponse.json({
        success: true,
        message: `Affiliate set to ${status}.`,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[Admin Affiliates] POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update affiliate data" },
      { status: 500 }
    );
  }
}
