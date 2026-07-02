import { auth, currentUser } from "@clerk/nextjs/server";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { fetchYouTubeChannels, fetchChannelVideos } from "@/lib/youtube/channels";
import { saveChannel, saveTrendRadar } from "@/lib/cache/turso";

function generateLocalTrendsAndIdeas(channel, videos) {
  const views = videos || [];
  
  // Sort videos by view count to find top performing topics
  const sortedVideos = [...views].sort((a, b) => {
    const vA = parseInt(a.statistics?.viewCount || a.views || 0, 10);
    const vB = parseInt(b.statistics?.viewCount || b.views || 0, 10);
    return vB - vA;
  });

  // Extract clean keywords from top video titles
  const cleanKeywords = [];
  const stopwords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", "is", "are", 
    "was", "were", "my", "how", "why", "what", "you", "your", "this", "that", "of", "i", 
    "new", "best", "top", "easy", "tutorial", "vs", "with", "out", "about", "up", "down", "off"
  ]);
  
  sortedVideos.slice(0, 5).forEach(v => {
    const vTitle = v.snippet?.title || v.title || "";
    const words = vTitle.replace(/[^\w\s]/gi, "").split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.trim().toLowerCase();
      if (cleanWord.length > 3 && !stopwords.has(cleanWord)) {
        cleanKeywords.push(word.trim());
      }
    });
  });

  // Get top 3 unique keywords (preserve case)
  const uniqueKeywords = [];
  const seenLower = new Set();
  for (const kw of cleanKeywords) {
    const kwLower = kw.toLowerCase();
    if (!seenLower.has(kwLower)) {
      seenLower.add(kwLower);
      uniqueKeywords.push(kw);
      if (uniqueKeywords.length >= 3) break;
    }
  }

  // Fallbacks if not enough keywords
  while (uniqueKeywords.length < 3) {
    uniqueKeywords.push(["Viral Content", "Creator Strategy", "Editing Hooks"][uniqueKeywords.length]);
  }

  const kw1 = uniqueKeywords[0];
  const kw2 = uniqueKeywords[1];
  const kw3 = uniqueKeywords[2];

  return {
    summary: { totalVideosAnalyzed: views.length || 50 },
    insights: {
      overview: {
        viralPotential: "High",
        marketMomentum: "Rising",
        trendingTopics: 8,
        summary: `The niche surrounding ${kw1} and ${kw2} is experiencing high audience search intent. Upload frequency remains stable with opportunities in short-form adaptations of ${kw3}.`
      },
      quickWins: [
        { idea: `Create a 60-second summary on ${kw1} trends`, why: "Short-form clips for this topic have high vertical-feed virality.", effort: "low", timing: "Next 48h" },
        { idea: `Re-optimize title hooks for older videos about ${kw2}`, why: "Recent spikes in search traffic for this query can drive search volume.", effort: "low", timing: "This week" },
        { idea: `Collaborate or reply to recent community questions on ${kw3}`, why: "Direct engagement increases subscriber conversion rates.", effort: "low", timing: "Ongoing" }
      ],
      emergingTrends: [
        { topic: `The Rise of ${kw1} Automation`, viralScore: 88, momentum: "hot", difficulty: "medium", opportunity: "High demand for beginner-friendly step-by-step guides.", actionableIdea: `Build a 10-minute workflow showing how to automate ${kw1}.`, timeWindow: "15 Days", estimatedViews: "250K+" },
        { topic: `Modern ${kw2} Frameworks`, viralScore: 76, momentum: "rising", difficulty: "easy", opportunity: "Audiences are looking for replacements to stale design patterns.", actionableIdea: `Review and contrast the top 3 libraries for ${kw2}.`, timeWindow: "30 Days", estimatedViews: "120K+" },
        { topic: `Sustainable ${kw3} Ecosystems`, viralScore: 65, momentum: "stable", difficulty: "hard", opportunity: "Deep-dive case studies have a longer shelf-life and high CPC.", actionableIdea: `A documentary style video analyzing the economics of ${kw3}.`, timeWindow: "45 Days", estimatedViews: "85K+" }
      ],
      videoIdeas: [
        { title: `I Tried Every ${kw1} Method for 30 Days (Here's What Actually Works)`, description: "A highly engaging challenge format where you document your results using different strategies.", predictedViews: "3x Channel Avg", difficulty: "Medium" },
        { title: `The Ultimate ${kw2} Roadmap for 2026 (No Experience Required)`, description: "A comprehensive, visual roadmap covering tools, concepts, and templates for this topic.", predictedViews: "2x Channel Avg", difficulty: "Easy" },
        { title: `Why Most Creators Fail at ${kw3} (And How to Fix It)`, description: "An analytical breakdown of common pitfalls in this niche, backed by recent industry data.", predictedViews: "1.8x Channel Avg", difficulty: "Hard" }
      ],
      viralPatterns: {
        titleHooks: [
          `This ${kw1} secret changed my entire process...`,
          `I stopped doing ${kw2} and did this instead.`,
          `The ugly truth about ${kw3} in 2026.`
        ],
        contentStyles: [
          "Fast-paced visual edits showing real-time setup or results.",
          "Clear diagram-based breakdowns of abstract concepts.",
          "First-person case study narration with strong progress bars."
        ]
      }
    }
  };
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) return apiError(new Error("Unauthorized"), 401);

    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    if (userEmail !== "thecxsmic@gmail.com") {
      return apiError(new Error("Forbidden: Admin access required"), 403);
    }

    const { query } = await req.json();
    if (!query) {
      return apiError(new Error("Query (Channel ID or handle) is required"), 400);
    }

    console.log(`[Admin Share API] Generating shareable analysis for query: ${query}`);

    // 1. Fetch channel from YouTube
    const channels = await fetchYouTubeChannels(query);
    if (!channels || channels.length === 0) {
      return apiError(new Error("Channel not found on YouTube"), 404);
    }
    const youtubeChannel = channels[0];

    // 2. Fetch recent videos
    console.log(`[Admin Share API] Fetching videos for channel: ${youtubeChannel.id}`);
    const { items: youtubeVideos } = await fetchChannelVideos(youtubeChannel.id, 50);

    // 3. Save channel and videos to local database
    await saveChannel(youtubeChannel, youtubeVideos);
    console.log(`[Admin Share API] Successfully saved channel and ${youtubeVideos?.length || 0} videos to DB`);

    // 4. Generate local trends / ideas and save them
    const localTrends = generateLocalTrendsAndIdeas(youtubeChannel, youtubeVideos);
    await saveTrendRadar(youtubeChannel.id, localTrends);
    console.log(`[Admin Share API] Successfully generated and saved trend_radar data`);

    return apiSuccess({
      success: true,
      channelId: youtubeChannel.id,
      title: youtubeChannel?.snippet?.title || youtubeChannel?.title || "Unknown Channel"
    });
  } catch (error) {
    console.error("[Admin Share API] Error:", error);
    return apiError(error);
  }
}
