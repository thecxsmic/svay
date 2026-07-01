import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { getAnalysisById, logEmail, getLastEmail } from "@/lib/cache/turso";
import { sendEmail } from "@/lib/email/resend";
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

    // 1. Check 24h limit for this analysis
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

    // Build Email Content
    const subject = `Your Competitor Report: ${analysis.title}`;
    
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff; padding: 0; border-radius: 24px; overflow: hidden; border: 1px solid #333;">
        <div style="background: linear-gradient(135deg, #00dfd8 0%, #0070f3 100%); padding: 40px 30px; text-align: center;">
          <h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin: 0; color: #000;">Competitor Report</h1>
          <p style="color: rgba(0,0,0,0.6); font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; margin-bottom: 0;">For ${analysis.subject_title || 'Your Channel'}</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="font-size: 16px; font-weight: 900; text-transform: uppercase; color: #00dfd8; margin-bottom: 20px; border-bottom: 1px solid #222; padding-bottom: 10px;">Market Rivals</h2>
          
          ${validData.map(({ channel, videos }) => {
            const subCount = parseInt(channel.statistics.subscriberCount);
            const viewCount = parseInt(channel.statistics.viewCount);
            const videoCount = parseInt(channel.statistics.videoCount);
            
            let badge = { label: 'Direct Peer', color: '#888', bg: 'rgba(255,255,255,0.05)' };
            if (subCount > 1000000) badge = { label: 'Market Leader', color: '#ff0055', bg: 'rgba(255,0,85,0.1)' };
            else if (subCount > 100000) badge = { label: 'Rising Star', color: '#00dfd8', bg: 'rgba(0,223,216,0.1)' };

            return `
              <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 20px; padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                  <img src="${channel.snippet.thumbnails.default.url}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #333;" />
                  <div style="flex: 1;">
                    <p style="font-weight: 900; margin: 0; font-size: 18px; color: #fff;">${channel.snippet.title}</p>
                    <div style="display: inline-block; background: ${badge.bg}; color: ${badge.color}; padding: 3px 8px; border-radius: 6px; font-size: 9px; font-weight: 900; text-transform: uppercase; margin-top: 4px;">
                      ${badge.label}
                    </div>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: rgba(255,255,255,0.02); border-radius: 12px; padding: 15px;">
                  <div>
                    <p style="font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0;">Subscribers</p>
                    <p style="font-size: 16px; font-weight: 900; margin: 0; color: #fff;">${subCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p style="font-size: 10px; color: #666; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0;">Total Reach</p>
                    <p style="font-size: 16px; font-weight: 900; margin: 0; color: #fff;">${viewCount.toLocaleString()}</p>
                  </div>
                </div>
                
                <p style="font-size: 10px; font-weight: 900; text-transform: uppercase; color: #444; margin-bottom: 12px; letter-spacing: 1px; border-left: 3px solid #00dfd8; padding-left: 10px;">Recent Breakthroughs</p>
                ${videos.length > 0 ? videos.map(v => `
                  <div style="font-size: 13px; color: #ccc; margin-bottom: 8px; line-height: 1.4; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                    ${v.snippet.title}
                  </div>
                `).join('') : '<p style="font-size: 12px; color: #444; font-style: italic;">No recent uploads found.</p>'}
              </div>
            `;
          }).join('')}

          <div style="background: linear-gradient(135deg, rgba(255,0,85,0.1) 0%, rgba(0,112,243,0.1) 100%); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); margin-top: 40px;">
            <h2 style="font-size: 14px; font-weight: 900; text-transform: uppercase; color: #ff0055; margin-bottom: 15px; margin-top: 0;">Strategic Plan</h2>
            <p style="font-size: 14px; color: #aaa; line-height: 1.6; margin-bottom: 20px;">
              Your rivals are currently dominating with the titles shown above. To gain an edge, we recommend focusing on <strong>higher-velocity content</strong> that targets their engagement gaps. Use their "Recent Wins" as a blueprint for your next upload.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://updates.svay.space'}/competitors?analysisId=${analysisId}" style="display: block; background: #ffffff; color: #000000; text-decoration: none; padding: 15px; border-radius: 12px; font-weight: 900; font-size: 13px; text-transform: uppercase; text-align: center; letter-spacing: 1px;">Open Full interactive Matrix</a>
          </div>
        </div>

        <div style="padding: 30px; border-top: 1px solid #1a1a1a; text-align: center; background: #050505;">
          <p style="font-size: 11px; font-weight: bold; color: #444; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Powered by Svay Intelligence</p>
        </div>
      </div>
    `;

    console.log("[Competitor Email API] Sending via Resend...");
    const result = await sendEmail({
      to: userEmail,
      subject,
      html
    });

    if (!result.success) {
      console.error("[Competitor Email API] Resend Error:", result.error);
      return apiError(new Error(result.error), 500);
    }

    console.log("[Competitor Email API] Success! Logging to DB...");
    // 2. Log the email send
    await logEmail(userId, 'competitor_analysis', analysisId);

    return apiSuccess({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("[Competitor Email API] Global Error:", error);
    return apiError(error);
  }
}
