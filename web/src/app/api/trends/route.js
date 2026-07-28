import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groqPrimary = createGroq({
  apiKey: process.env.GROQ_API_KEY
});

const groqBackup = createGroq({
  apiKey: process.env.GROQ_API_KEY_BACKUP
});

async function generateObjectWithFallback({ modelName, ...options }) {
  try {
    return await generateObject({
      ...options,
      model: groqPrimary(modelName)
    });
  } catch (error) {
    console.warn(`[Groq AI] Primary key failed or rate-limited. Falling back to backup key. Error: ${error.message || error}`);
    return await generateObject({
      ...options,
      model: groqBackup(modelName)
    });
  }
}
import { z } from "zod";
import { calculateViralityScore } from "@/lib/ranking/virality";
import { getTrendRadar, saveTrendRadar, getLastEmail, getTrendRadarHistory, saveTrendRadarHistory, getCache, setCache } from "@/lib/cache/turso";
import { getIsDemoMode, MOCK_TREND_RADAR } from "@/lib/utils/demoMock";

/**
 * Optimized helper: Fetch recent channel upload videos via playlistItems.list (1 unit) instead of search.list (100 units).
 * Saves 99 units per channel lookup!
 */
async function fetchRecentUploadsViaPlaylist(channelId, limit = 10) {
  try {
    const { getYouTubeApiKey } = await import("@/lib/youtube/apiKeyManager");
    const channelKey = await getYouTubeApiKey("channels.list");
    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.searchParams.set("part", "contentDetails,snippet,statistics");
    channelUrl.searchParams.set("id", channelId);
    channelUrl.searchParams.set("key", channelKey);
    const channelRes = await fetch(channelUrl.toString());
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) return { channel: null, videos: [] };
    const channel = channelData.items[0];
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) return { channel, videos: [] };

    const playlistKey = await getYouTubeApiKey("playlistItems.list");
    const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    playlistUrl.searchParams.set("part", "snippet,contentDetails");
    playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
    playlistUrl.searchParams.set("maxResults", String(limit));
    playlistUrl.searchParams.set("key", playlistKey);

    const playlistRes = await fetch(playlistUrl.toString());
    const playlistData = await playlistRes.json();

    if (!playlistData.items || playlistData.items.length === 0) return { channel, videos: [] };

    const videoIds = playlistData.items.map(item => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId).filter(Boolean);
    if (videoIds.length === 0) return { channel, videos: [] };

    const statsKey = await getYouTubeApiKey("videos.list");
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    statsUrl.searchParams.set("part", "snippet,statistics");
    statsUrl.searchParams.set("id", videoIds.slice(0, 50).join(","));
    statsUrl.searchParams.set("key", statsKey);

    const statsRes = await fetch(statsUrl.toString());
    const statsData = await statsRes.json();
    return { channel, videos: statsData.items || [] };
  } catch (err) {
    console.error("[Trends API] Error fetching recent uploads via playlist:", err);
    return { channel: null, videos: [] };
  }
}

const trendSchema = z.object({
  summary: z.object({
    totalVideosAnalyzed: z.number().describe("Estimated number of videos analyzed in the niche"),
  }),
  insights: z.object({
    overview: z.object({
      viralPotential: z.enum(['Low', 'Medium', 'High']),
      marketMomentum: z.enum(['Stable', 'Rising', 'Hot']),
      trendingTopics: z.number(),
      summary: z.string().describe("A 2-3 sentence overview of the current market state for this channel's niche")
    }),
    quickWins: z.array(z.object({
      idea: z.string(),
      why: z.string(),
      effort: z.enum(['low', 'medium', 'high']),
      timing: z.string()
    })).length(3),
    emergingTrends: z.array(z.object({
      topic: z.string(),
      viralScore: z.number().min(0).max(100),
      momentum: z.enum(['stable', 'rising', 'hot']),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      opportunity: z.string(),
      actionableIdea: z.string(),
      timeWindow: z.string(),
      estimatedViews: z.string()
    })).length(3),
    videoIdeas: z.array(z.object({
      title: z.string().describe("A catchy, click-optimized title"),
      description: z.string().describe("A short explanation of the video concept"),
      predictedViews: z.string().describe("Realistic view estimate based on channel average"),
      difficulty: z.enum(['Easy', 'Medium', 'Hard'])
    })).length(3),
    viralPatterns: z.object({
      titleHooks: z.array(z.string()).length(3),
      contentStyles: z.array(z.string()).length(3)
    })
  })
});

const searchQueriesSchema = z.object({
  queries: z.array(z.string()).length(3).describe("3 highly specific search queries to find current trending videos in the channel's niche")
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (await getIsDemoMode()) {
      return Response.json({ success: true, data: MOCK_TREND_RADAR });
    }

    if (!channelId) {
      return Response.json({ success: false, error: "Channel ID is required" }, { status: 400 });
    }

    const cached = await getTrendRadar(channelId);
    return Response.json({
      success: true,
      data: cached?.data || null,
      last_updated: cached?.last_updated || null
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const isDemo = await getIsDemoMode();
  let userId = null;
  if (!isDemo) {
    const authResult = await auth();
    userId = authResult.userId;
  }
  const body = await req.json();
  const { channelId, channelTitle, channelBased, forceRefresh } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        if (isDemo) {
          send({ type: 'step', progress: 10, message: 'Fetching channel context (Demo)...' });
          await new Promise(r => setTimeout(r, 450));
          
          send({ type: 'step', progress: 30, message: 'AI generating targeted search queries (Demo)...' });
          await new Promise(r => setTimeout(r, 500));
          
          send({ type: 'step', progress: 45, message: 'Scanning market for competitors (Demo)...' });
          await new Promise(r => setTimeout(r, 450));
          
          send({ type: 'step', progress: 60, message: 'Analyzing competitor strategies (Demo)...' });
          await new Promise(r => setTimeout(r, 500));
          
          send({ type: 'step', progress: 80, message: 'AI synthesizing customized Trend Radar (Demo)...' });
          await new Promise(r => setTimeout(r, 450));
          
          send({ type: 'complete', data: MOCK_TREND_RADAR });
          controller.close();
          return;
        }

        // 0. Check Backend Cache (24 hours) — bypass if forceRefresh is true
        if (!forceRefresh && channelBased && channelId) {
          const cachedRadar = await getTrendRadar(channelId);
          if (cachedRadar) {
            const now = Math.floor(Date.now() / 1000);
            const oneDay = 24 * 60 * 60;
            if (now - cachedRadar.last_updated < oneDay) {
              console.log(`[Trends API] Using fresh backend cache for ${channelId}`);
              
              const lastEmail = await getLastEmail(userId, 'trend_radar', channelId);
              
              const origin = req.headers.get('origin') || req.nextUrl.origin;
              const cookieHeader = req.headers.get('cookie');
              fetch(`${origin}/api/trends/email`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(cookieHeader ? { cookie: cookieHeader } : {})
                },
                body: JSON.stringify({ channelId, userId })
              }).catch(err => {
                console.error("[Trends API] Error triggering cached email:", err);
              });

              send({ type: 'step', progress: 100, message: 'Loading current radar...' });
              send({ type: 'complete', data: { ...cachedRadar.data, lastEmailSentAt: lastEmail } });
              controller.close();
              return;
            }
          }
        }

        send({ type: 'step', progress: 10, message: 'Fetching channel context (Low-quota playlist mode)...' });
        
        let channel = null;
        let recentVideos = [];

        // 1. Optimized: Fetch channel data & videos via playlist (3 units vs 100 units!)
        if (channelBased && channelId) {
          const res = await fetchRecentUploadsViaPlaylist(channelId, 10);
          if (res.channel) channel = res.channel;
          if (res.videos) recentVideos = res.videos;
        }

        // 2. AI generates 3 targeted search queries
        send({ type: 'step', progress: 30, message: 'AI generating 3 targeted search queries...' });
        let searchQueries = [];
        
        if (channel && recentVideos.length > 0) {
          const prompt = `You are a YouTube market researcher. Based on the following recent videos from the channel "${channel.snippet.title}", generate 3 highly specific YouTube search queries that will help us find CURRENT trending competitors and viral videos in this exact niche.
          
Recent Videos:
${recentVideos.slice(0, 10).map(v => `- ${v.snippet?.title || v.title || ''}`).join('\n')}

Do not generate generic queries. Generate 3 specific, trend-focused queries.`;

          const { object } = await generateObjectWithFallback({
            modelName: 'openai/gpt-oss-120b',
            schema: searchQueriesSchema,
            prompt,
            temperature: 0.7,
          });
          searchQueries = object.queries;
        } else {
          const niche = channelTitle ? channelTitle.split(' ')[0] : 'tech';
          searchQueries.push(`${niche} trending 2026`, `${niche} viral`, `how to ${niche} 2026`);
        }

        // 3. Search YouTube using queries (Deduplicated & Cached 12h across users)
        send({ type: 'step', progress: 45, message: 'Scanning market for viral competitors...' });
        const trendingVideos = [];
        const { getYouTubeApiKey } = await import("@/lib/youtube/apiKeyManager");
        const uniqueQueries = Array.from(new Set((searchQueries || []).map(q => q.trim().toLowerCase()))).slice(0, 3);

        await Promise.all(uniqueQueries.map(async (query) => {
          try {
            const cacheKey = `yt_search_v1_${encodeURIComponent(query)}`;
            const cachedResults = await getCache(cacheKey);
            if (cachedResults && Array.isArray(cachedResults) && cachedResults.length > 0) {
              console.log(`[Trends API] Search cache hit for query: "${query}" (0 quota units used)`);
              trendingVideos.push(...cachedResults);
              return;
            }

            const searchKey = await getYouTubeApiKey("search.list");
            const url = new URL("https://www.googleapis.com/youtube/v3/search");
            url.searchParams.set("part", "snippet");
            url.searchParams.set("q", query);
            url.searchParams.set("type", "video");
            url.searchParams.set("maxResults", "10");
            url.searchParams.set("order", "viewCount");
            const date45DaysAgo = new Date();
            date45DaysAgo.setDate(date45DaysAgo.getDate() - 45);
            url.searchParams.set("publishedAfter", date45DaysAgo.toISOString());
            url.searchParams.set("key", searchKey);

            const res = await fetch(url.toString());
            const data = await res.json();
            
            if (data.items && data.items.length > 0) {
              trendingVideos.push(...data.items);
              await setCache(cacheKey, data.items, 12 * 3600).catch(() => {});
            }
          } catch (err) {
            console.error("[Trends API] Search query failed:", query, err);
          }
        }));

        // Fetch stats for trending videos in batches of 50
        const uniqueTrending = [];
        const seenVideoIds = new Set();
        for (const v of trendingVideos) {
          const vid = v.id?.videoId || v.id;
          if (vid && !seenVideoIds.has(vid)) {
            seenVideoIds.add(vid);
            uniqueTrending.push(vid);
          }
        }

        let trendingWithStats = [];
        if (uniqueTrending.length > 0) {
          const chunks = [];
          for (let i = 0; i < uniqueTrending.length; i += 50) {
            chunks.push(uniqueTrending.slice(i, i + 50));
          }

          for (const chunk of chunks) {
            try {
              const statsKey = await getYouTubeApiKey("videos.list");
              const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
              statsUrl.searchParams.set("part", "snippet,statistics");
              statsUrl.searchParams.set("id", chunk.join(","));
              statsUrl.searchParams.set("key", statsKey);
              const statsRes = await fetch(statsUrl.toString());
              const statsData = await statsRes.json();
              if (statsData.items) {
                trendingWithStats.push(...statsData.items);
              }
            } catch(err) {
              console.error("[Trends API] Stats batch fetch failed", err);
            }
          }
        }

        // 4. Calculate metrics & identify top competitors
        send({ type: 'step', progress: 60, message: 'Analyzing competitor strategies...' });
        const videosWithMetrics = trendingWithStats.map(item => {
          const virality = calculateViralityScore(item);
          return {
            title: item.snippet?.title || '',
            channelId: item.snippet?.channelId || '',
            channelTitle: item.snippet?.channelTitle || '',
            viewCount: parseInt(item.statistics?.viewCount || 0, 10),
            viralScore: virality.score,
          };
        }).sort((a, b) => b.viralScore - a.viralScore);

        const channelCounts = {};
        for (const v of videosWithMetrics) {
          if (!v.channelId || v.channelId === channelId) continue;
          if (!channelCounts[v.channelId]) {
            channelCounts[v.channelId] = { id: v.channelId, title: v.channelTitle, totalScore: 0 };
          }
          channelCounts[v.channelId].totalScore += v.viralScore;
        }
        
        const topCompetitors = Object.values(channelCounts)
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3);

        // 5. Optimized: Fetch top competitor recent uploads via playlistItems (3 units vs 100 units each!)
        const competitorInsights = [];
        for (const comp of topCompetitors) {
          try {
            const { videos: compVids } = await fetchRecentUploadsViaPlaylist(comp.id, 5);
            if (compVids && compVids.length > 0) {
              const compTitles = compVids.map(i => i.snippet?.title || i.title || '').filter(Boolean);
              competitorInsights.push({
                channel: comp.title,
                recentTitles: compTitles
              });
            }
          } catch (err) {}
        }

        // Fetch past trend radar scans for context
        send({ type: 'step', progress: 70, message: 'Loading historical context...' });
        const pastScans = channelBased && channelId ? await getTrendRadarHistory(channelId, 3) : [];
        
        let historicalContext = '';
        if (pastScans.length > 0) {
          historicalContext = `\n\nHISTORICAL CONTEXT (Past ${pastScans.length} Scans):`;
          pastScans.forEach((scan, idx) => {
            const daysAgo = Math.floor((Date.now() / 1000 - scan.created_at) / 86400);
            const trends = scan.data?.insights?.emergingTrends || [];
            const trendTopics = trends.map(t => t.topic).slice(0, 3);
            historicalContext += `\n${daysAgo} days ago: Tracked trends were ${trendTopics.join(', ')}`;
          });
          historicalContext += `\n\nIMPORTANT: Consider what has changed, what's new, and what trends are evolving. Build on previous insights rather than repeating them.`;
        }

        // 5. AI synthesizes Trend Radar
        send({ type: 'step', progress: 80, message: 'AI synthesizing customized Trend Radar...' });
        
        let avgViews = 0;
        if (recentVideos.length > 0) {
          const totalViews = recentVideos.reduce((sum, v) => sum + parseInt(v.statistics?.viewCount || 0), 0);
          avgViews = Math.round(totalViews / recentVideos.length);
        }
        const subCount = parseInt(channel?.statistics?.subscriberCount || 0);

        const currentDate = new Date().toISOString().split('T')[0];
        const prompt = `You are an elite YouTube Trend Analyst AI. Create a highly customized Trend Radar analysis for the channel "${channel?.snippet?.title || channelTitle || 'General'}".
Current Date: ${currentDate}

USER CHANNEL CONTEXT:
Subscriber Count: ${subCount > 0 ? subCount.toLocaleString() : 'Unknown'}
Average Views per Video: ${avgViews > 0 ? avgViews.toLocaleString() : 'New/Small Channel'}
Recent Videos: ${recentVideos.slice(0, 5).map(v => `"${v.snippet.title}"`).join(', ')}

MARKET INTELLIGENCE:
Top Viral Videos in Niche:
${videosWithMetrics.slice(0, 10).map(v => `- "${v.title}" by ${v.channelTitle} (Viral Score: ${v.viralScore})`).join('\n')}

COMPETITOR RECENT UPLOADS:
${competitorInsights.map(c => `Channel: ${c.channel}\nRecent Videos: ${c.recentTitles.join(', ')}`).join('\n\n')}${historicalContext}

INSTRUCTIONS:
1. Synthesize this data to find emerging patterns, hooks, and content styles that competitors are using successfully right now.
2. ${pastScans.length > 0 ? 'IMPORTANT: Use the historical context to identify NEW and EVOLVING trends. Focus on what has changed or is emerging since the last scan. Avoid repeating old ideas unless they have significantly evolved.' : 'Focus on current emerging trends and opportunities.'}
3. Customize all 'quick wins' and 'emerging trends' so they specifically fit the user's channel context while leveraging what's currently working for competitors.
4. Ensure actionable ideas are highly specific to the niche.
5. Generate exactly 3 highly customized 'videoIdeas' specifically tailored for the user's channel based on the emerging trends.
6. CRITICAL: Base your 'estimatedViews' and 'predictedViews' strictly on the user's current Average Views (${avgViews > 0 ? avgViews.toLocaleString() : 'Low'}) and Subscriber Count. Scale it realistically for a successful video on THEIR specific channel (e.g., if they average 100 views, a "viral" video for them might be 500-2K views, NOT 1M views).
7. Total videos analyzed should be exactly ${videosWithMetrics.length}.
8. CRITICAL: Return ONLY a raw JSON object with the exact structure requested. Do NOT include "$schema", "properties", or any schema definitions in your output.`;

        const { object } = await generateObjectWithFallback({
          modelName: 'openai/gpt-oss-120b',
          schema: trendSchema,
          prompt,
          temperature: 0.7,
        });

        send({ type: 'step', progress: 95, message: 'Finalizing Trend Radar...' });
        
        object.summary.totalVideosAnalyzed = videosWithMetrics.length > 0 ? videosWithMetrics.length : 120;
        object.historyCount = pastScans.length; // Include history count for UI

        send({ type: 'complete', data: object });

        // Save to cache and history
        if (channelBased && channelId) {
          saveTrendRadar(channelId, object).catch(err => {
            console.error("[Trends API] Error saving to Turso:", err);
          });
          
          // Save to history for future context
          saveTrendRadarHistory(channelId, object).catch(err => {
            console.error("[Trends API] Error saving to history:", err);
          });

          // Trigger email report in background
          const origin = req.headers.get('origin') || req.nextUrl.origin;
          const cookieHeader = req.headers.get('cookie');
          fetch(`${origin}/api/trends/email`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(cookieHeader ? { cookie: cookieHeader } : {})
            },
            body: JSON.stringify({ channelId, userId })
          }).catch(err => {
            console.error("[Trends API] Error triggering email:", err);
          });
        }

        controller.close();
      } catch (err) {
        console.error('Trend radar generation error:', err);
        send({ type: 'error', message: err.message || 'Failed to generate trend radar' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
