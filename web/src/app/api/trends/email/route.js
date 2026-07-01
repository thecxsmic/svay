import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { getTrendRadar, logEmail, getLastEmail, getUserChannel, checkEmailRateLimit } from "@/lib/cache/turso";
import { sendEmail } from "@/lib/email/resend";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function POST(req) {
  try {
    console.log("[Trend Email API] Received request");
    const body = await req.json();
    const { channelId, userId: providedUserId } = body;
    
    let userId = (await auth()).userId;
    let userEmail = null;

    if (!userId && providedUserId) {
      console.log("[Trend Email API] Using background userId:", providedUserId);
      userId = providedUserId;
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const user = await clerk.users.getUser(userId);
      userEmail = user.emailAddresses[0]?.emailAddress;
    } else if (userId) {
      const user = await currentUser();
      userEmail = user.emailAddresses[0]?.emailAddress;
    }
    
    if (!userId || !userEmail) {
      console.error("[Trend Email API] Unauthorized: No valid user session or ID");
      return apiError(new Error("Unauthorized"), 401);
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

    // Build Email Content
    const subject = `Market Pulse: Your Trend Radar is Ready`;
    
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; padding: 0; border-radius: 24px; overflow: hidden; border: 1px solid #333;">
        <div style="background: linear-gradient(135deg, #ff0055 0%, #0070f3 100%); padding: 40px 30px; text-align: center;">
          <h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin: 0; color: #fff;">Trend Radar</h1>
          <p style="color: rgba(255,255,255,0.6); font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; margin-bottom: 0;">Real-time Intelligence</p>
        </div>

        <div style="padding: 30px;">
          <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 20px; padding: 24px; margin-bottom: 30px; text-align: center;">
            <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #666; margin-bottom: 10px; letter-spacing: 2px;">Market Momentum</p>
            <h2 style="font-size: 32px; font-weight: 900; margin: 0; color: #ff0055; text-transform: uppercase; letter-spacing: -1px;">${insights.overview.marketMomentum}</h2>
            <p style="font-size: 14px; color: #888; margin-top: 10px; line-height: 1.5;">Viral potential is currently <strong style="color: #fff;">${insights.overview.viralPotential}</strong>. ${insights.overview.summary}</p>
          </div>

          <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #00dfd8; margin-bottom: 20px; border-bottom: 1px solid #222; padding-bottom: 10px;">High-Impact Ideas</h2>
          ${insights.videoIdeas.map(idea => `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid #111; padding: 20px; border-radius: 16px; margin-bottom: 15px;">
              <p style="font-weight: 900; margin: 0; font-size: 17px; color: #fff;">${idea.title}</p>
              <p style="font-size: 13px; color: #aaa; margin-top: 8px; line-height: 1.4;">${idea.description}</p>
              <div style="display: flex; gap: 10px; margin-top: 15px;">
                <span style="background: rgba(0, 223, 216, 0.1); color: #00dfd8; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase;">${idea.difficulty}</span>
                <span style="background: rgba(255, 0, 85, 0.1); color: #ff0055; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase;">${idea.predictedViews} Views</span>
              </div>
            </div>
          `).join('')}

          <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr; gap: 20px;">
            <div style="background: #0a0a0a; border: 1px solid #111; padding: 24px; border-radius: 20px;">
              <h3 style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #00dfd8; margin: 0 0 15px 0;">Quick Wins</h3>
              ${insights.quickWins.map(win => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #111;">
                  <p style="font-size: 14px; font-weight: bold; margin: 0; color: #fff;">${win.idea}</p>
                  <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">${win.why} • ${win.timing}</p>
                </div>
              `).join('')}
            </div>

            <div style="background: #0a0a0a; border: 1px solid #111; padding: 24px; border-radius: 20px;">
              <h3 style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #ff0055; margin: 0 0 15px 0;">Winning Patterns</h3>
              <p style="font-size: 11px; font-weight: bold; color: #444; text-transform: uppercase; margin-bottom: 10px;">Psychological Hooks</p>
              ${insights.viralPatterns.titleHooks.map(hook => `
                <div style="font-size: 13px; color: #ccc; margin-bottom: 8px; padding-left: 10px; border-left: 2px solid #ff0055;">
                  ${hook}
                </div>
              `).join('')}
            </div>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://updates.svay.space'}/radar" style="display: block; background: #ffffff; color: #000000; text-decoration: none; padding: 18px; border-radius: 12px; font-weight: 900; font-size: 13px; text-transform: uppercase; text-align: center; letter-spacing: 1px; margin-top: 40px;">Launch Full Intelligence Radar</a>
        </div>

        <div style="padding: 30px; border-top: 1px solid #1a1a1a; text-align: center; background: #050505;">
          <p style="font-size: 11px; font-weight: bold; color: #444; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Powered by Svay Intelligence</p>
        </div>
      </div>
    `;

    console.log("[Trend Email API] Sending via Resend...");
    const result = await sendEmail({
      to: userEmail,
      subject,
      html
    });

    if (!result.success) {
      console.error("[Trend Email API] Resend Error:", result.error);
      return apiError(new Error(result.error), 500);
    }

    console.log("[Trend Email API] Success! Logging to DB...");
    await logEmail(userId, 'trend_radar', channelId);

    return apiSuccess({ success: true, message: "Trend radar email sent" }, 200, rateLimitHeaders);
  } catch (error) {
    console.error("[Trend Email API] Global Error:", error);
    return apiError(error);
  }
}
