import { auth, currentUser } from "@clerk/nextjs/server";
import { getAnalysisById, logEmail, getLastEmail } from "@/lib/cache/turso";
import { sendEmail } from "@/lib/email/resend";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function POST(req) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) return apiError(new Error("Unauthorized"), 401);

    const { analysisId, email } = await req.json();
    if (!analysisId) return apiError(new Error("Analysis ID is required"), 400);

    // 1. Check 24h limit for this analysis
    const lastEmailTime = await getLastEmail(userId, 'competitor_analysis', analysisId);
    if (lastEmailTime) {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - lastEmailTime < oneDay) {
        const hoursLeft = Math.ceil((oneDay - (now - lastEmailTime)) / (60 * 60 * 1000));
        return apiError(new Error(`You can only email this report once every 24 hours. Please wait ${hoursLeft} more hour${hoursLeft !== 1 ? 's' : ''}.`), 429);
      }
    }

    const analysis = await getAnalysisById(userId, analysisId);
    if (!analysis) return apiError(new Error("Analysis not found"), 404);

    const targetEmail = email || user.emailAddresses[0]?.emailAddress;
    if (!targetEmail) return apiError(new Error("No recipient email found"), 400);

    // Fetch full competitor details and recent videos from YouTube for the email content
    const apiKey = process.env.YOUTUBE_API_KEY;
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
          return null;
        }
      })
    );

    const validData = competitorsData.filter(Boolean);

    // Build Email Content
    const subject = `Your Competitor Report: ${analysis.title}`;
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #080808; color: white; padding: 40px; border-radius: 24px;">
        <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 8px;">Competitor Report</h1>
        <p style="color: #666; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 32px;">For ${analysis.subject_title || 'Your Channel'}</p>
        
        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #00dfd8; margin-bottom: 16px;">The Channels You're Watching</h2>
          ${validData.map(({ channel, videos }) => `
            <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 16px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05);">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                <img src="${channel.snippet.thumbnails.default.url}" style="width: 40px; height: 40px; border-radius: 50%;" />
                <div>
                  <p style="font-weight: 900; margin: 0; font-size: 16px;">${channel.snippet.title}</p>
                  <p style="font-size: 11px; color: #666; margin: 0;">${parseInt(channel.statistics.subscriberCount).toLocaleString()} Subs • ${parseInt(channel.statistics.viewCount).toLocaleString()} Total Views</p>
                </div>
              </div>
              
              <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #444; margin-bottom: 8px; letter-spacing: 1px;">Their Latest Videos</p>
              ${videos.map(v => `
                <div style="font-size: 13px; color: #ccc; margin-bottom: 6px; padding-left: 8px; border-left: 2px solid #00dfd8;">
                  ${v.snippet.title}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>

        <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 16px;">
          <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #ff0055; margin-bottom: 16px;">Quick Plan</h2>
          <p style="font-size: 14px; color: #ccc; line-height: 1.6;">Based on what these channels are doing, you should focus on making videos that get views fast. These rivals are growing because they fill gaps that you can target too. Look at their latest titles above for ideas.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://vyron.ai'}/competitors?analysisId=${analysisId}" style="display: inline-block; background: white; color: black; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 900; font-size: 12px; text-transform: uppercase; margin-top: 16px;">See the Full Report</a>
        </div>

        <p style="font-size: 10px; color: #444; margin-top: 40px; text-align: center;">Sent by Vyron</p>
      </div>
    `;

    const result = await sendEmail({
      to: targetEmail,
      subject,
      html
    });

    if (!result.success) {
      return apiError(new Error(result.error), 500);
    }

    // 2. Log the email send
    await logEmail(userId, 'competitor_analysis', analysisId);

    return apiSuccess({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("[Competitor Email API] Error:", error);
    return apiError(error);
  }
}
