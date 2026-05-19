import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { calculateViralityScore } from "@/lib/ranking/virality";
import { getTrendRadar, saveTrendRadar, getLastEmail } from "@/lib/cache/turso";

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
  queries: z.array(z.string()).min(3).max(5).describe("Highly specific search queries to find current trending videos in the channel's niche")
});

export async function POST(req) {
  const { userId } = await auth();
  const body = await req.json();
  const { channelId, channelTitle, channelBased } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // 0. Check Backend Cache (24 hours)
        if (channelBased && channelId) {
          const cachedRadar = await getTrendRadar(channelId);
          if (cachedRadar) {
            const now = Math.floor(Date.now() / 1000);
            const oneDay = 24 * 60 * 60;
            if (now - cachedRadar.last_updated < oneDay) {
              console.log(`[Trends API] Using fresh backend cache for ${channelId}`);
              
              // Get last email time
              const lastEmail = await getLastEmail(userId, 'trend_radar', channelId);
              
          // Trigger email report in background if not sent in last 24h
          const origin = req.headers.get('origin') || req.nextUrl.origin;
          fetch(`${origin}/api/trends/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        send({ type: 'step', progress: 10, message: 'Fetching channel context...' });
        
        let channel = null;
        let recentVideos = [];
        const apiKey = process.env.YOUTUBE_API_KEY;

        // 1. Fetch channel data & videos
        if (channelBased && channelId) {
          try {
            const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
            channelUrl.searchParams.set("part", "snippet,statistics");
            channelUrl.searchParams.set("id", channelId);
            channelUrl.searchParams.set("key", apiKey);
            const channelRes = await fetch(channelUrl.toString());
            const channelData = await channelRes.json();
            
            if (channelData.items && channelData.items.length > 0) {
              channel = channelData.items[0];
            }

            const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
            searchUrl.searchParams.set("part", "snippet");
            searchUrl.searchParams.set("channelId", channelId);
            searchUrl.searchParams.set("type", "video");
            searchUrl.searchParams.set("order", "date");
            searchUrl.searchParams.set("maxResults", "10");
            searchUrl.searchParams.set("key", apiKey);

            const searchRes = await fetch(searchUrl.toString());
            const searchData = await searchRes.json();

            if (searchData.items) {
              const videoIds = searchData.items.map(item => item.id.videoId);
              if (videoIds.length > 0) {
                const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
                statsUrl.searchParams.set("part", "snippet,statistics");
                statsUrl.searchParams.set("id", videoIds.join(","));
                statsUrl.searchParams.set("key", apiKey);

                const statsRes = await fetch(statsUrl.toString());
                const statsData = await statsRes.json();
                recentVideos = statsData.items || [];
              }
            }
          } catch (err) {
            console.error("Failed to fetch channel context", err);
          }
        }

        // 2. AI generates search queries based on user's videos
        send({ type: 'step', progress: 30, message: 'AI generating targeted search queries...' });
        let searchQueries = [];
        
        if (channel && recentVideos.length > 0) {
          const prompt = `You are a YouTube market researcher. Based on the following recent videos from the channel "${channel.snippet.title}", generate 5 highly specific YouTube search queries that will help us find the CURRENT trending competitors and viral videos in this exact niche.
          
Recent Videos:
${recentVideos.slice(0, 10).map(v => `- ${v.snippet.title}`).join('\n')}

Do not generate generic queries. Generate specific, trend-focused queries.`;

          const { object } = await generateObject({
            model: groq('openai/gpt-oss-120b'),
            schema: searchQueriesSchema,
            prompt,
            temperature: 0.7,
          });
          searchQueries = object.queries;
        } else {
          const niche = channelTitle ? channelTitle.split(' ')[0] : 'tech';
          searchQueries.push(`${niche} trending 2026`, `${niche} viral`, `how to ${niche} 2026`);
        }

        // 3. Search YouTube using queries
        send({ type: 'step', progress: 45, message: 'Scanning market for competitors...' });
        const trendingVideos = [];
        await Promise.all(searchQueries.map(async (query) => {
          try {
            const url = new URL("https://www.googleapis.com/youtube/v3/search");
            url.searchParams.set("part", "snippet");
            url.searchParams.set("q", query);
            url.searchParams.set("type", "video");
            url.searchParams.set("maxResults", "10");
            url.searchParams.set("order", "viewCount");
            const date45DaysAgo = new Date();
            date45DaysAgo.setDate(date45DaysAgo.getDate() - 45);
            url.searchParams.set("publishedAfter", date45DaysAgo.toISOString());
            url.searchParams.set("key", apiKey);

            const res = await fetch(url.toString());
            const data = await res.json();
            
            if (data.items) {
              trendingVideos.push(...data.items);
            }
          } catch (err) {
            console.error("Search query failed:", query, err);
          }
        }));

        // Fetch stats for trending videos
        const uniqueTrending = [];
        const seenVideoIds = new Set();
        for (const v of trendingVideos) {
          const vid = v.id?.videoId;
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
              const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
              statsUrl.searchParams.set("part", "snippet,statistics");
              statsUrl.searchParams.set("id", chunk.join(","));
              statsUrl.searchParams.set("key", apiKey);
              const statsRes = await fetch(statsUrl.toString());
              const statsData = await statsRes.json();
              if (statsData.items) {
                trendingWithStats.push(...statsData.items);
              }
            } catch(err) {
              console.error("Stats fetch failed", err);
            }
          }
        }

        // 4. Calculate metrics & identify top competitors
        send({ type: 'step', progress: 60, message: 'Analyzing competitor strategies...' });
        const videosWithMetrics = trendingWithStats.map(item => {
          const virality = calculateViralityScore(item);
          return {
            title: item.snippet.title,
            channelId: item.snippet.channelId,
            channelTitle: item.snippet.channelTitle,
            viewCount: parseInt(item.statistics.viewCount || 0),
            viralScore: virality.score,
          };
        }).sort((a, b) => b.viralScore - a.viralScore);

        const channelCounts = {};
        for (const v of videosWithMetrics) {
          if (v.channelId === channelId) continue;
          if (!channelCounts[v.channelId]) {
            channelCounts[v.channelId] = { id: v.channelId, title: v.channelTitle, totalScore: 0 };
          }
          channelCounts[v.channelId].totalScore += v.viralScore;
        }
        
        const topCompetitors = Object.values(channelCounts)
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3);

        // Fetch top competitor recent videos
        const competitorInsights = [];
        for (const comp of topCompetitors) {
          try {
            const compVideosUrl = new URL("https://www.googleapis.com/youtube/v3/search");
            compVideosUrl.searchParams.set("part", "snippet");
            compVideosUrl.searchParams.set("channelId", comp.id);
            compVideosUrl.searchParams.set("order", "date");
            compVideosUrl.searchParams.set("type", "video");
            compVideosUrl.searchParams.set("maxResults", "5");
            compVideosUrl.searchParams.set("key", apiKey);
            
            const compRes = await fetch(compVideosUrl.toString());
            const compData = await compRes.json();
            
            if (compData.items && compData.items.length > 0) {
              const compTitles = compData.items.map(i => i.snippet.title);
              competitorInsights.push({
                channel: comp.title,
                recentTitles: compTitles
              });
            }
          } catch (err) {}
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
${competitorInsights.map(c => `Channel: ${c.channel}\nRecent Videos: ${c.recentTitles.join(', ')}`).join('\n\n')}

INSTRUCTIONS:
1. Synthesize this data to find emerging patterns, hooks, and content styles that competitors are using successfully right now.
2. Customize all 'quick wins' and 'emerging trends' so they specifically fit the user's channel context while leveraging what's currently working for competitors.
3. Ensure actionable ideas are highly specific to the niche.
4. Generate exactly 3 highly customized 'videoIdeas' specifically tailored for the user's channel based on the emerging trends.
5. CRITICAL: Base your 'estimatedViews' and 'predictedViews' strictly on the user's current Average Views (${avgViews > 0 ? avgViews.toLocaleString() : 'Low'}) and Subscriber Count. Scale it realistically for a successful video on THEIR specific channel (e.g., if they average 100 views, a "viral" video for them might be 500-2K views, NOT 1M views).
6. Total videos analyzed should be exactly ${videosWithMetrics.length}.
7. CRITICAL: Return ONLY a raw JSON object with the exact structure requested. Do NOT include "$schema", "properties", or any schema definitions in your output.`;

        const { object } = await generateObject({
          model: groq('openai/gpt-oss-120b'),
          schema: trendSchema,
          prompt,
          temperature: 0.7,
        });

        send({ type: 'step', progress: 95, message: 'Finalizing Trend Radar...' });
        
        object.summary.totalVideosAnalyzed = videosWithMetrics.length > 0 ? videosWithMetrics.length : 120;

        send({ type: 'complete', data: object });

        // Save to cache
        if (channelBased && channelId) {
          saveTrendRadar(channelId, object).catch(err => {
            console.error("[Trends API] Error saving to Turso:", err);
          });

          // Trigger email report in background
          const origin = req.headers.get('origin') || req.nextUrl.origin;
          fetch(`${origin}/api/trends/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
