import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { getAnalysisById, logEmail, getLastEmail, checkEmailRateLimit } from "@/lib/cache/turso";
import { sendEmail } from "@/lib/email/resend";
import { competitorReportEmail } from "@/lib/email/templates";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function POST(req) {
  try {
    console.log("[Competitor Email API] Received request");
    const body = await req.json();
    const { analysisId, email, userId: providedUserId } = body;
    
    let userId = (await auth()).userId;
    let userEmail = email;

    if (!userId && providedUserId) {
      console.log("[Competitor Email API] Using background userId:", providedUserId);
      userId = providedUserId;
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const user = await clerk.users.getUser(userId);
      userEmail = userEmail || user.emailAddresses[0]?.emailAddress;
    } else if (userId) {
      const user = await currentUser();
      userEmail = userEmail || user.emailAddresses[0]?.emailAddress;
    }
    
    if (!userId || !userEmail) {
      console.error("[Competitor Email API] Unauthorized: No user or userId");
      return apiError(new Error("Unauthorized"), 401);
    }

    console.log("[Competitor Email API] Analysis ID:", analysisId);
    
    if (!analysisId) return apiError(new Error("Analysis ID is required"), 400);

    // 1. Check overall 3 emails per day per user limit
    const emailRateLimit = await checkEmailRateLimit(userId);
    const rateLimitHeaders = {
      'X-RateLimit-Limit': String(emailRateLimit.limit),
      'X-RateLimit-Remaining': String(emailRateLimit.remaining),
      'X-RateLimit-Reset': String(emailRateLimit.reset),
    };

    if (emailRateLimit.limited) {
      console.warn(`[Competitor Email API] User ${userId} has hit the daily limit of 3 emails.`);
      return apiError(new Error("Daily email sending limit (3 emails) reached. Please try again in 24 hours."), 429, rateLimitHeaders);
    }

    // 1b. Check 24h limit for this analysis
    const lastEmailTime = await getLastEmail(userId, 'competitor_analysis', analysisId);
    if (lastEmailTime) {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - lastEmailTime < oneDay) {
        const hoursLeft = Math.ceil((oneDay - (now - lastEmailTime)) / (60 * 60 * 1000));
        console.warn("[Competitor Email API] Limit hit. Hours left:", hoursLeft);
        return apiError(new Error(`You can only email this report once every 24 hours. Please wait ${hoursLeft} more hour${hoursLeft !== 1 ? 's' : ''}.`), 429);
      }
    }

    const analysis = await getAnalysisById(userId, analysisId);
    if (!analysis) {
      console.error("[Competitor Email API] Analysis not found in DB:", analysisId);
      return apiError(new Error("Analysis not found"), 404);
    }

    console.log("[Competitor Email API] Target Email:", userEmail);
    
    // Fetch full competitor details and recent videos from YouTube for the email content
    const apiKey = process.env.YOUTUBE_API_KEY;
    console.log("[Competitor Email API] Using YT API Key:", apiKey ? "Present" : "MISSING");
    
    const competitorsData = await Promise.all(
      analysis.competitor_ids.map(async (id) => {
        try {
          const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${id}&key=${apiKey}`);
          const cData = await cRes.json();
          const channel = cData.items?.[0];
          
          if (!channel) return null;

          // Fetch recent 3 videos
          const vRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${id}&order=date&type=video&maxResults=3&key=${apiKey}`);
          const vData = await vRes.json();
          const videos = vData.items || [];

          return { channel, videos };
        } catch (e) {
          console.error(`[Competitor Email API] Error fetching YT data for ${id}:`, e);
          return null;
        }
      })
    );

    const validData = competitorsData.filter(Boolean);
    console.log("[Competitor Email API] Valid competitors found:", validData.length);

    const emailContent = competitorReportEmail({
      analysisTitle: analysis.title,
      subjectTitle: analysis.subject_title,
      analysisId,
      competitors: validData,
    });

    console.log("[Competitor Email API] Sending via Resend...");
    const result = await sendEmail({
      to: userEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (!result.success) {
      console.error("[Competitor Email API] Resend Error:", result.error);
      return apiError(new Error(result.error), 500);
    }

    console.log("[Competitor Email API] Success! Logging to DB...");
    // 2. Log the email send
    await logEmail(userId, 'competitor_analysis', analysisId);

    return apiSuccess({ success: true, message: "Email sent successfully" }, 200, rateLimitHeaders);
  } catch (error) {
    console.error("[Competitor Email API] Global Error:", error);
    return apiError(error);
  }
}
