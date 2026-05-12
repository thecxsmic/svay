import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserChannel } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { calculateViralityScore } from "@/lib/ranking/virality";

// Define the schema for video ideas
const videoIdeasSchema = z.object({
  ideas: z.array(z.object({
    title: z.string().describe('Catchy, clickable video title that matches channel style'),
    description: z.string().describe('Detailed description explaining why this idea would work for this specific channel'),
    category: z.string().describe('Video category (Tutorial, Review, Challenge, Vlog, Gaming, etc.)'),
    estimatedViews: z.string().describe('Estimated view range based on channel performance (e.g., "10K-25K")'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('Production difficulty level'),
    trending: z.boolean().describe('Whether this topic is currently trending'),
    tags: z.array(z.string()).describe('Relevant hashtags/keywords (max 5)'),
    targetAudience: z.string().describe('Specific audience segment this video targets'),
    bestPostTime: z.string().describe('Recommended posting time/day for maximum reach'),
    contentFormat: z.string().describe('Recommended format (Short-form, Long-form, Live, etc.)')
  })).max(6)
});

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const { channelId, channelData } = await request.json();

    if (!channelId && !channelData) {
      return apiError(new Error("Channel ID or Channel Data is required"), 400);
    }

    // Verify if this is the user's channel
    const userChannel = await getUserChannel(userId);
    const targetChannelId = channelId || channelData?.channel?.id;
    
    if (!userChannel || userChannel.id !== targetChannelId) {
      return apiError(new Error("You can only generate ideas for your registered channel."), 403);
    }

    let channelInfo = channelData;

    // If channel data not provided, fetch it
    if (!channelInfo) {
      const channelResponse = await fetch(`${request.nextUrl.origin}/api/youtube/channel?channelId=${channelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!channelResponse.ok) {
        throw new Error('Failed to fetch channel data');
      }

      const channelResult = await channelResponse.json();
      
      if (!channelResult.success) {
        throw new Error(channelResult.error || 'Failed to get channel information');
      }

      channelInfo = {
        channel: channelResult.channel,
        recentVideos: channelResult.videos.map(v => ({
          ...v,
          viewCount: parseInt(v.statistics?.viewCount || 0),
          likeCount: parseInt(v.statistics?.likeCount || 0),
          commentCount: parseInt(v.statistics?.commentCount || 0)
        }))
      };
    }

    const channel = channelInfo.channel;
    const recentVideos = channelInfo.recentVideos || [];

    // 1. ANALYZE USER CHANNEL
    const analytics = calculateChannelAnalytics(channel, recentVideos);
    const topVideos = [...recentVideos].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);

    // 4. GENERATE SEARCH QUERIES
    const searchQueries = [];
    if (analytics.popularTopics && analytics.popularTopics.length > 0) {
      searchQueries.push(...analytics.popularTopics.slice(0, 3).map(t => `${t} 2026`));
      searchQueries.push(...analytics.popularTopics.slice(0, 3).map(t => `how to ${t}`));
    } else {
      searchQueries.push("trending topics 2026", "viral videos", "latest trends");
    }

    // 5. SEARCH TRENDING VIDEOS
    // Parallel API searches
    const apiKey = process.env.YOUTUBE_API_KEY;
    const trendingVideos = [];
    
    await Promise.all(searchQueries.map(async (query) => {
      try {
        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("q", query);
        url.searchParams.set("type", "video");
        url.searchParams.set("maxResults", "10");
        url.searchParams.set("order", "viewCount"); // get popular ones
        // Keep recent videos only (<=45 days)
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

    // Remove duplicates
    const uniqueTrending = [];
    const seenVideoIds = new Set();
    for (const v of trendingVideos) {
      const vid = v.id?.videoId;
      if (vid && !seenVideoIds.has(vid)) {
        seenVideoIds.add(vid);
        uniqueTrending.push(vid);
      }
    }

    // Fetch video stats to calculate metrics
    let trendingWithStats = [];
    if (uniqueTrending.length > 0) {
      // Chunk requests by 50
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

    // 6. CALCULATE VIRAL METRICS
    const videosWithMetrics = trendingWithStats.map(item => {
      const virality = calculateViralityScore(item);
      return {
        id: item.id,
        title: item.snippet.title,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        viewCount: parseInt(item.statistics.viewCount || 0),
        likeCount: parseInt(item.statistics.likeCount || 0),
        commentCount: parseInt(item.statistics.commentCount || 0),
        publishedAt: item.snippet.publishedAt,
        viralScore: virality.score,
        engagementRate: virality.engagement,
        dailyViews: virality.dailyViews
      };
    }).sort((a, b) => b.viralScore - a.viralScore);

    // 7. FIND TOP COMPETITORS
    const channelCounts = {};
    for (const v of videosWithMetrics) {
      if (v.channelId === targetChannelId) continue; // Skip own channel
      if (!channelCounts[v.channelId]) {
        channelCounts[v.channelId] = { id: v.channelId, title: v.channelTitle, count: 0, totalScore: 0 };
      }
      channelCounts[v.channelId].count++;
      channelCounts[v.channelId].totalScore += v.viralScore;
    }
    
    // Rank competitors
    const topCompetitors = Object.values(channelCounts)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 2);

    // 8. ANALYZE COMPETITORS
    const competitorAnalysis = [];
    for (const comp of topCompetitors) {
      try {
        const compVideosUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        compVideosUrl.searchParams.set("part", "snippet");
        compVideosUrl.searchParams.set("channelId", comp.id);
        compVideosUrl.searchParams.set("order", "date");
        compVideosUrl.searchParams.set("type", "video");
        compVideosUrl.searchParams.set("maxResults", "10");
        compVideosUrl.searchParams.set("key", apiKey);
        
        const compRes = await fetch(compVideosUrl.toString());
        const compData = await compRes.json();
        
        if (compData.items && compData.items.length > 0) {
          const compVideoIds = compData.items.map(i => i.id.videoId).filter(Boolean);
          if (compVideoIds.length > 0) {
            const cStatsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
            cStatsUrl.searchParams.set("part", "snippet,statistics");
            cStatsUrl.searchParams.set("id", compVideoIds.join(","));
            cStatsUrl.searchParams.set("key", apiKey);
            const cStatsRes = await fetch(cStatsUrl.toString());
            const cStatsData = await cStatsRes.json();
            
            if (cStatsData.items) {
              const compTitles = cStatsData.items.map(i => i.snippet.title);
              const compCommonWords = extractCommonWords(compTitles);
              competitorAnalysis.push({
                title: comp.title,
                recentFormats: determineContentType(compTitles),
                topTopics: compCommonWords.slice(0, 3),
                avgViews: Math.round(cStatsData.items.reduce((sum, v) => sum + parseInt(v.statistics?.viewCount || 0), 0) / cStatsData.items.length)
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to analyze competitor", comp.title, err);
      }
    }

    // 9. AGGREGATE MARKET INTELLIGENCE
    const marketIntelligence = {
      trendingTopics: extractCommonWords(videosWithMetrics.map(v => v.title)).slice(0, 8),
      topViralVideos: videosWithMetrics.slice(0, 5).map(v => `"${v.title}" (${v.viewCount} views, Score: ${v.viralScore})`),
      competitorInsights: competitorAnalysis
    };

    // 10. AI STRATEGY GENERATION
    const channelContext = `
USER CHANNEL ANALYSIS:
Name: ${channel.title}
Avg Views/Video: ${analytics.avgViewsPerVideo.toLocaleString()}
Engagement Rate: ${analytics.avgEngagementRate}%
Top Formats: ${analytics.topContentType}
Top Topics: ${analytics.popularTopics.join(', ')}

TOP RECENT VIDEOS:
${topVideos.map(v => `- "${v.title}" (${(v.viewCount || 0).toLocaleString()} views)`).join('\n')}

MARKET INTELLIGENCE (TRENDS & COMPETITORS):
Trending Topics right now: ${marketIntelligence.trendingTopics.join(', ')}
Top Viral Videos in niche:
${marketIntelligence.topViralVideos.map(v => `- ${v}`).join('\n')}

COMPETITOR STRATEGIES:
${marketIntelligence.competitorInsights.map(c => `- ${c.title}: Avg Views ${c.avgViews}, Formats: ${c.recentFormats}, Topics: ${c.topTopics.join(', ')}`).join('\n')}
    `;

    const prompt = `You are an elite YouTube strategist AI. 
Based on the provided User Channel Analysis and Market Intelligence, generate 6 highly personalized, data-driven video ideas for this channel.

${channelContext}

STRATEGIC GUIDELINES:
1. Merge the channel's proven formats with emerging market trends.
2. Find gaps competitors are missing or formats that can be improved.
3. Base view estimates realistically on channel's avg views + viral potential.
4. Ensure title hooks are click-optimized (curiosity, value, or emotion).

Generate exactly 6 ideas that maximize growth potential.
CRITICAL: Return ONLY a raw JSON object with the exact structure requested. Do NOT include "$schema", "properties", or any schema definitions in your output.`;

    const { object } = await generateObject({
      model: groq('openai/gpt-oss-120b'),
      schema: videoIdeasSchema,
      prompt,
      temperature: 0.7,
    });

    // 11. SANITIZE AI RESPONSE
    let ideas = object.ideas || [];
    ideas = ideas.slice(0, 6); // Limit to 6

    const sanitizedIdeas = ideas.map(idea => ({
      ...idea,
      personalizationScore: calculatePersonalizationScore(idea, analytics),
      channelFit: assessChannelFit(idea, channel, analytics)
    }));

    // 12. REDUCE USER CREDITS
    // TODO: Deduct 1 credit from user's account when credit system is fully implemented in DB schema.

    // 13. RETURN FINAL REPORT
    return apiSuccess({
      ideas: sanitizedIdeas,
      channelAnalytics: analytics,
      marketIntelligence,
      competitors: competitorAnalysis,
      generationContext: {
        channelId,
        channelName: channel.title,
        analysisDate: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error generating video ideas:', error);
    return apiError(error, 500);
  }
}

// Helper function to calculate advanced channel analytics
function calculateChannelAnalytics(channel, recentVideos) {
  const totalViews = recentVideos.reduce((sum, video) => sum + (video.viewCount || 0), 0);
  const totalLikes = recentVideos.reduce((sum, video) => sum + (video.likeCount || 0), 0);
  const totalComments = recentVideos.reduce((sum, video) => sum + (video.commentCount || 0), 0);
  
  const avgViewsPerVideo = recentVideos.length > 0 ? Math.round(totalViews / recentVideos.length) : 0;
  const avgEngagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : 0;
  
  const bestVideo = recentVideos.reduce((best, current) => 
    (current.viewCount || 0) > (best?.viewCount || 0) ? current : best, null
  );
  
  const videoTitles = recentVideos.map(v => v.title?.toLowerCase() || "");
  const commonWords = extractCommonWords(videoTitles);
  
  const uploadDates = recentVideos
    .filter(v => v.published_at || v.snippet?.publishedAt || v.publishedAt)
    .map(v => new Date(v.published_at || v.snippet?.publishedAt || v.publishedAt))
    .sort((a, b) => b - a);
    
  const daysBetween = uploadDates.length > 1 ? 
    (uploadDates[0] - uploadDates[uploadDates.length - 1]) / (1000 * 60 * 60 * 24) / (uploadDates.length - 1) : 0;
  
  const uploadFrequency = daysBetween === 0 ? 'Unknown' :
                         daysBetween < 2 ? 'Daily' : 
                         daysBetween < 4 ? 'Every 2-3 days' :
                         daysBetween < 8 ? 'Weekly' : 'Less than weekly';
  
  return {
    avgViewsPerVideo,
    avgEngagementRate,
    bestVideo,
    topContentType: determineContentType(videoTitles),
    uploadFrequency,
    growthTrend: calculateGrowthTrend(recentVideos),
    preferredLength: 'Mixed lengths',
    popularTopics: commonWords.slice(0, 5),
    postingPattern: analyzePostingPattern(uploadDates),
    audienceEngagement: avgEngagementRate > 5 ? 'High' : avgEngagementRate > 2 ? 'Medium' : 'Low',
    contentStyle: analyzeContentStyle(videoTitles, channel.description || '')
  };
}

// Helper functions
function extractCommonWords(titles) {
  const words = titles.join(' ').split(/[^a-z0-9]+/i).filter(Boolean);
  const frequency = {};
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'why', 'when', 'where', 'who', 'i', 'you', 'my', 'this', 'that', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'a', 'an'];
  
  words.forEach(word => {
    const cleanWord = word.toLowerCase();
    if (cleanWord.length > 3 && !stopWords.includes(cleanWord)) {
      frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
    }
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .map(([word]) => word);
}

function determineContentType(titles) {
  const types = {
    tutorial: ['tutorial', 'how', 'guide', 'tips', 'learn', 'fix'],
    review: ['review', 'test', 'vs', 'comparison', 'best', 'unboxing'],
    vlog: ['vlog', 'day', 'life', 'routine', 'daily', 'trip'],
    gaming: ['gaming', 'gameplay', 'game', 'play', 'stream', 'lets play'],
    reaction: ['reaction', 'reacting', 'responds', 'react', 'watch']
  };
  
  let maxCount = 0;
  let topType = 'General';
  
  Object.entries(types).forEach(([type, keywords]) => {
    const count = titles.reduce((sum, title) => {
      return sum + keywords.reduce((keywordSum, keyword) => {
        return keywordSum + (title.includes(keyword) ? 1 : 0);
      }, 0);
    }, 0);
    
    if (count > maxCount) {
      maxCount = count;
      topType = type.charAt(0).toUpperCase() + type.slice(1);
    }
  });
  
  return topType;
}

function calculateGrowthTrend(videos) {
  if (videos.length < 4) return 'Stable';
  
  const mid = Math.ceil(videos.length / 2);
  const recent = videos.slice(0, mid);
  const older = videos.slice(mid);
  
  const recentAvg = recent.reduce((sum, v) => sum + (v.viewCount || 0), 0) / recent.length;
  const olderAvg = older.reduce((sum, v) => sum + (v.viewCount || 0), 0) / older.length;
  
  if (olderAvg === 0) return 'Growing';
  const growth = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (growth > 20) return 'Strong Growth';
  if (growth > 5) return 'Growing';
  if (growth > -5) return 'Stable';
  return 'Declining';
}

function analyzePostingPattern(dates) {
  if (dates.length < 3) return 'Irregular';
  
  const days = dates.map(d => d.getDay());
  const dayCount = days.reduce((count, day) => {
    count[day] = (count[day] || 0) + 1;
    return count;
  }, {});
  
  const sortedDays = Object.entries(dayCount).sort(([,a], [,b]) => b - a);
  const mostCommonDay = sortedDays[0];
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `Often posts on ${dayNames[mostCommonDay[0]]}`;
}

function analyzeContentStyle(titles, description) {
  const allText = (titles.join(' ') + ' ' + description).toLowerCase();
  
  if (allText.includes('tutorial') || allText.includes('learn') || allText.includes('how')) {
    return 'Educational';
  } else if (allText.includes('funny') || allText.includes('comedy') || allText.includes('laugh')) {
    return 'Entertainment';
  } else if (allText.includes('review') || allText.includes('analysis') || allText.includes('comparison')) {
    return 'Analytical';
  } else if (allText.includes('vlog') || allText.includes('life') || allText.includes('daily')) {
    return 'Lifestyle';
  } else {
    return 'Mixed';
  }
}

function calculatePersonalizationScore(idea, analytics) {
  let score = 0.5;
  if (idea.category.toLowerCase() === analytics.topContentType.toLowerCase()) score += 0.2;
  if (idea.trending && analytics.growthTrend === 'Declining') score += 0.2;
  return Math.min(score + (Math.random() * 0.2), 1.0).toFixed(2);
}

function assessChannelFit(idea, channel, analytics) {
  const reasons = [];
  if (idea.category.toLowerCase() === analytics.topContentType.toLowerCase()) reasons.push('Matches proven content type');
  if (idea.trending && analytics.growthTrend !== 'Strong Growth') reasons.push('Potential for growth boost');
  return reasons.length > 0 ? reasons.join(', ') : 'Good general fit';
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST to generate video ideas.' 
  }, { status: 405 });
}
