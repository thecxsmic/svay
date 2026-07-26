import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { getTrendRadar, logEmail, getLastEmail, checkEmailRateLimit } from "@/lib/cache/turso";
import { sendEmail } from "@/lib/email/resend";
import { trendRadarEmail } from "@/lib/email/templates";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function POST(req) {
  try {
    console.log("[Trend Email API] Received request");
    const body = await req.json().catch(() => ({}));
    const { channelId, userId: providedUserId, email: providedEmail } = body;

    let userId = null;
    let userEmail = providedEmail || null;

    try {
      const authObj = await auth();
      userId = authObj?.userId || null;
    } catch (e) {
      console.warn("[Trend Email API] auth() warning:", e?.message);
    }

    if (!userId && providedUserId) {
      console.log("[Trend Email API] Using background userId:", providedUserId);
      userId = providedUserId;
    }

    if (userId && !userEmail) {
      try {
        const user = await currentUser();
        userEmail = user?.emailAddresses?.[0]?.emailAddress || null;
      } catch (e) {
        console.warn("[Trend Email API] currentUser() warning:", e?.message);
      }
    }

    if (userId && !userEmail && process.env.CLERK_SECRET_KEY) {
      try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
        const user = await clerk.users.getUser(userId);
        userEmail = user?.emailAddresses?.[0]?.emailAddress || null;
      } catch (e) {
        console.warn("[Trend Email API] Clerk getUser warning:", e?.message);
      }
    }

    if (!userId || !userEmail) {
      console.error("[Trend Email API] Unauthorized: Could not resolve user or user email");
      return apiError(new Error("Unauthorized: User email not found"), 401);
    }

    if (!channelId) return apiError(new Error("Channel ID is required"), 400);

    // 1. Check overall 3 emails per day per user limit
    const emailRateLimit = await checkEmailRateLimit(userId);
    const rateLimitHeaders = {
      'X-RateLimit-Limit': String(emailRateLimit.limit),
      'X-RateLimit-Remaining': String(emailRateLimit.remaining),
      'X-RateLimit-Reset': String(emailRateLimit.reset),
    };

    if (emailRateLimit.limited) {
      console.warn(`[Trend Email API] User ${userId} has hit the daily limit of 3 emails.`);
      return apiError(new Error("Daily email sending limit (3 emails) reached. Please try again in 24 hours."), 429, rateLimitHeaders);
    }

    // 1b. Check 24h limit for trend radar emails for this channel
    const lastEmailTime = await getLastEmail(userId, 'trend_radar', channelId);
    if (lastEmailTime) {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - lastEmailTime < oneDay) {
        console.warn("[Trend Email API] 24h limit hit");
        return apiSuccess({ success: false, message: "Email already sent in last 24h" });
      }
    }

    // 2. Get Radar Data
    const radar = await getTrendRadar(channelId);
    if (!radar) {
      console.error("[Trend Email API] Radar data not found for:", channelId);
      return apiError(new Error("Radar data not found"), 404);
    }

    const data = radar.data;
    const insights = data.insights;

    const emailContent = trendRadarEmail({
      insights,
      channelId,
    });

    console.log("[Trend Email API] Sending via Resend to:", userEmail);
    const result = await sendEmail({
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.success) {
      console.error("[Trend Email API] Resend Error:", result.error);
      return apiError(new Error(result.error || "Failed to deliver email"), 500);
    }

    console.log("[Trend Email API] Success! Logging to DB...");
    await logEmail(userId, 'trend_radar', channelId);

    return apiSuccess({ success: true, message: `Trend radar email sent to ${userEmail}` }, 200, rateLimitHeaders);
  } catch (error) {
    console.error("[Trend Email API] Global Error:", error);
    return apiError(error);
  }
}
