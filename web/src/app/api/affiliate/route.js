import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getAffiliateDashboard,
  upsertAffiliateProfile,
  normalizeAffiliateCode,
  AFFILIATE_COMMISSION_RATE,
  AFFILIATE_COMMISSION_MONTHS,
  COMMISSION_PLANS,
} from "@/lib/affiliate";

/**
 * GET — creator's affiliate dashboard (stats, referrals, monthly earnings).
 * POST — join program / update PayPal + display name.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dashboard = await getAffiliateDashboard(userId);
    if (!dashboard) {
      return NextResponse.json({
        enrolled: false,
        plans: COMMISSION_PLANS,
        program: {
          commissionRate: AFFILIATE_COMMISSION_RATE,
          commissionMonths: AFFILIATE_COMMISSION_MONTHS,
          description:
            "Earn 10% lifetime commission on every payment from users you refer — forever, with no expiry.",
        },
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.DODO_PAYMENTS_RETURN_URL ||
      "https://svay.space";

    return NextResponse.json({
      enrolled: true,
      plans: COMMISSION_PLANS,
      program: {
        commissionRate: dashboard.affiliate.commissionRate,
        commissionMonths: dashboard.affiliate.commissionMonths,
        commissionType: dashboard.affiliate.commissionType,
      },
      referralLink: `${baseUrl.replace(/\/$/, "")}/r/${dashboard.affiliate.code}`,
      ...dashboard,
    });
  } catch (error) {
    console.error("[Affiliate API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load affiliate dashboard" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { paypalEmail, displayName, code, commissionType } = body;

    if (paypalEmail && typeof paypalEmail === "string") {
      const email = paypalEmail.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "Invalid PayPal email address" },
          { status: 400 }
        );
      }
    }

    if (code && !normalizeAffiliateCode(code)) {
      return NextResponse.json(
        { error: "Invalid code. Use letters, numbers, _ or - (max 24)." },
        { status: 400 }
      );
    }

    let userEmail = "";
    let userName = "";
    try {
      const user = await currentUser();
      userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
      userName =
        displayName ||
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        user?.username ||
        "";
    } catch {
      /* ignore */
    }

    const affiliate = await upsertAffiliateProfile({
      userId,
      email: userEmail,
      displayName: displayName || userName,
      paypalEmail,
      code,
      commissionType: 'lifetime', // only plan currently available
    });

    const dashboard = await getAffiliateDashboard(userId);
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.DODO_PAYMENTS_RETURN_URL ||
      "https://svay.space";

    return NextResponse.json({
      success: true,
      enrolled: true,
      message: affiliate
        ? "Affiliate profile saved."
        : "Joined the affiliate program.",
      referralLink: `${baseUrl.replace(/\/$/, "")}/?ref=${dashboard.affiliate.code}`,
      ...dashboard,
    });
  } catch (error) {
    console.error("[Affiliate API] POST error:", error);
    const msg = error?.message || "Failed to save affiliate profile";
    if (/UNIQUE|unique/i.test(msg)) {
      return NextResponse.json(
        { error: "That affiliate code is already taken. Pick another." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
