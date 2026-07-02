import { auth, currentUser } from "@clerk/nextjs/server";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { fetchYouTubeChannels, fetchChannelVideos } from "@/lib/youtube/channels";
import { getChannel, getChannelVideos, saveChannel, saveTrendRadar } from "@/lib/cache/turso";
import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { calculateViralityScore } from "@/lib/ranking/virality";
import { getIsDemoMode, MOCK_CHANNELS, generateMockVideos, MOCK_TREND_RADAR } from "@/lib/utils/demoMock";

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

  // Niche classification
  let niche = "general";
  const channelTitle = (channel?.snippet?.title || channel?.title || "").toLowerCase();
  const titleTokens = (sortedVideos.map(v => (v.snippet?.title || v.title || "").toLowerCase()).join(" ") + " " + channelTitle).toLowerCase();
  
  if (/\b(car|cars|drive|driving|ride|engine|exhaust|bmw|porsche|ferrari|tesla|toyota|ford|audi|mercedes|veloce|racing|speed|supercar|supercars|turbo|vehicle|vehicles|motor|motors)\b/i.test(titleTokens)) {
    niche = "automotive";
  } else if (/\b(game|games|gaming|play|gameplay|minecraft|fortnite|roblox|gta|cod|ps5|xbox|nintendo|walkthrough|mod|speedrun|twitch|streamer)\b/i.test(titleTokens)) {
    niche = "gaming";
  } else if (/\b(code|coding|programming|software|app|web|react|nextjs|javascript|python|developer|automation|ai|gpt|copilot|github|html|css|dev)\b/i.test(titleTokens)) {
    niche = "tech";
  } else if (/\b(money|finance|crypto|bitcoin|stocks|invest|investing|rich|business|market|revenue|passive income|trading|forex|wealth|budget|budgeting|gold)\b/i.test(titleTokens)) {
    niche = "finance";
  } else if (/\b(vlog|travel|trip|lifestyle|routine|food|eat|cooking|recipe|vlogs|baking|kitchen|restaurant|fitness|workout|gym)\b/i.test(titleTokens)) {
    niche = "lifestyle";
  }

  console.log(`[Admin Share API] Niche classified as: ${niche.toUpperCase()} based on video title keywords`);

  // Niche-based templates
  let overviewSummary = "";
  let quickWins = [];
  let emergingTrends = [];
  let videoIdeas = [];
  let titleHooks = [];
  let contentStyles = [];

  switch (niche) {
    case "automotive":
      overviewSummary = `The automotive content space surrounding ${kw1} and ${kw2} is experiencing high audience search intent. Upload frequency remains stable with opportunities in short-form track videos and reviews of ${kw3}.`;
      quickWins = [
        { idea: `Create a 60-second exhaust sound or drag race clip on ${kw1}`, why: "Vertical short-form car videos convert viewers instantly.", effort: "low", timing: "Next 48h" },
        { idea: `Re-optimize title hooks for older videos about ${kw2}`, why: "Spikes in searches for this car model can drive legacy views.", effort: "low", timing: "This week" },
        { idea: `Reply to community questions about ${kw3} maintenance or specs`, why: "Direct viewer interactions build high subscriber loyalty.", effort: "low", timing: "Ongoing" }
      ];
      emergingTrends = [
        { topic: `The Shift to Hybrid ${kw1} Models`, viralScore: 88, momentum: "hot", difficulty: "medium", opportunity: `Reviewing the performance and sound differences in new ${kw1} builds.`, actionableIdea: `Do a sound and acceleration comparison of hybrid and V8 ${kw1} builds.`, timeWindow: "15 Days", estimatedViews: "350K+" },
        { topic: `Restoring Classic ${kw2} Cars`, viralScore: 76, momentum: "rising", difficulty: "easy", opportunity: "Audiences love time-lapse restoration vlogs and detailing videos.", actionableIdea: `Find a cheap or dusty ${kw2} and do an aesthetic visual wash & restore.`, timeWindow: "30 Days", estimatedViews: "180K+" },
        { topic: `Market Price Drops for ${kw3}`, viralScore: 65, momentum: "stable", difficulty: "hard", opportunity: "Help buyers avoid massive depreciation traps.", actionableIdea: `Analyzing if the ${kw3} is actually worth buying in the current market.`, timeWindow: "45 Days", estimatedViews: "95K+" }
      ];
      videoIdeas = [
        { title: `I Bought the Cheapest ${kw1} in the Country (And Tried to Drive It 500 Miles)`, description: "A long-distance road trip challenge documenting mechanical breakdowns and real-world performance.", predictedViews: "3.5x Channel Avg", difficulty: "Medium" },
        { title: `Why Everyone is Wrong About the New ${kw2} (Full Owners Review)`, description: "An honest, detailed breakdown of daily driving comfort, fuel economy, and track performance.", predictedViews: "2.2x Channel Avg", difficulty: "Easy" },
        { title: `How to Maintain Your ${kw3} on a Budget (Step-by-Step DIY)`, description: "A simple guide to common repairs, saving money, and essential tools needed for this vehicle.", predictedViews: "1.9x Channel Avg", difficulty: "Hard" }
      ];
      titleHooks = [
        `This ${kw1} secret changed my entire process...`,
        `I stopped doing ${kw2} and did this instead.`,
        `The ugly truth about ${kw3} in 2026.`
      ];
      contentStyles = [
        "Fast-paced visual edits showing real-time setup or results.",
        "Clear diagram-based breakdowns of abstract concepts.",
        "First-person case study narration with strong progress bars."
      ];
      break;

    case "gaming":
      overviewSummary = `The gaming community surrounding ${kw1} and ${kw2} is highly active. Audiences are looking for easter eggs, mods, and performance tips, with emerging search queries in ${kw3} updates.`;
      quickWins = [
        { idea: `Publish a 60-second trick, bug, or clutch clip on ${kw1}`, why: "Short gaming clips on vertical feeds convert subscribers quickly.", effort: "low", timing: "Next 24h" },
        { idea: `Re-optimize hooks for legacy guides about ${kw2}`, why: "Search spikes during game updates drive massive views.", effort: "low", timing: "This week" },
        { idea: `Reply to subscriber comments asking about your ${kw3} keybinds/setup`, why: "Builds active community engagement and loyalty.", effort: "low", timing: "Ongoing" }
      ];
      emergingTrends = [
        { topic: `${kw1} Custom Mods & Speedruns`, viralScore: 92, momentum: "hot", difficulty: "medium", opportunity: "High click-through-rate for crazy mod showcases.", actionableIdea: `Speedrunning ${kw1} using the most broken custom mods.`, timeWindow: "10 Days", estimatedViews: "400K+" },
        { topic: `${kw2} Season Patch Updates`, viralScore: 81, momentum: "rising", difficulty: "easy", opportunity: "New balances create massive viewer confusion.", actionableIdea: `Breaking down what the latest balance patch means for ${kw2} players.`, timeWindow: "20 Days", estimatedViews: "210K+" },
        { topic: `Hardcore 100 Days in ${kw3}`, viralScore: 70, momentum: "stable", difficulty: "hard", opportunity: "High-retention storytelling videos with visual progress bars.", actionableIdea: `A highly-edited 100 days survival challenge in ${kw3}.`, timeWindow: "40 Days", estimatedViews: "150K+" }
      ];
      videoIdeas = [
        { title: `I Played ${kw1} for 100 Hours (Here's What the Pros Don't Want You to Know)`, description: "A deep dive into advanced game mechanics, strategy maps, and professional tips.", predictedViews: "3x Channel Avg", difficulty: "Medium" },
        { title: `The Ultimate ${kw2} Beginner Guide for 2026 (Zero to Hero)`, description: "A comprehensive video guide to keybinds, settings, and early game strategies.", predictedViews: "2.4x Channel Avg", difficulty: "Easy" },
        { title: `Is ${kw3} Actually Dead? (My Honest Review)`, description: "An analytical review of the player base, updates, and overall state of the game.", predictedViews: "1.7x Channel Avg", difficulty: "Hard" }
      ];
      titleHooks = [
        `How I mastered the ${kw1} in 48 hours...`,
        `The most broken setup in ${kw2} right now.`,
        `Is this the end of ${kw3}?`
      ];
      contentStyles = [
        "High energy game capture clips showing intense moments first.",
        "Split-screen comparison layouts comparing old vs new patches.",
        "First-person voiceover narration with zooming highlight bubbles."
      ];
      break;

    case "tech":
      overviewSummary = `The developer space surrounding ${kw1} and ${kw2} is experiencing rapid growth. Search volume is rising for tutorials and reviews, with key gaps in practical tutorials using ${kw3}.`;
      quickWins = [
        { idea: `Create a 60-second summary on ${kw1} trends`, why: "Short-form clips for this tech have high vertical-feed virality.", effort: "low", timing: "Next 48h" },
        { idea: `Re-optimize title hooks for older videos about ${kw2}`, why: "Recent spikes in search traffic for this tech can drive legacy views.", effort: "low", timing: "This week" },
        { idea: `Collaborate or reply to community questions on ${kw3} issues`, why: "Direct developer engagement increases subscriber conversions.", effort: "low", timing: "Ongoing" }
      ];
      emergingTrends = [
        { topic: `The Rise of ${kw1} Automation`, viralScore: 88, momentum: "hot", difficulty: "medium", opportunity: "High demand for beginner-friendly step-by-step guides.", actionableIdea: `Build a 10-minute workflow showing how to automate ${kw1}.`, timeWindow: "15 Days", estimatedViews: "250K+" },
        { topic: `Modern ${kw2} Frameworks`, viralScore: 76, momentum: "rising", difficulty: "easy", opportunity: "Audiences are looking for replacements to stale design patterns.", actionableIdea: `Review and contrast the top 3 libraries for ${kw2}.`, timeWindow: "30 Days", estimatedViews: "120K+" },
        { topic: `Sustainable ${kw3} Ecosystems`, viralScore: 65, momentum: "stable", difficulty: "hard", opportunity: "Deep-dive case studies have a longer shelf-life and high CPC.", actionableIdea: `A documentary style video analyzing the economics of ${kw3}.`, timeWindow: "45 Days", estimatedViews: "85K+" }
      ];
      videoIdeas = [
        { title: `I Built a Full ${kw1} App in 24 Hours (Here's What Actually Happened)`, description: "A raw, highly-edited coding challenge detailing design struggles and deployment.", predictedViews: "3x Channel Avg", difficulty: "Medium" },
        { title: `The Ultimate ${kw2} Developer Roadmap for 2026`, description: "A comprehensive visual roadmap covering tools, concepts, and project ideas.", predictedViews: "2x Channel Avg", difficulty: "Easy" },
        { title: `Why Most Developers Fail at ${kw3} (And How to Fix It)`, description: "An analytical breakdown of common implementation mistakes, backed by real-world repository examples.", predictedViews: "1.8x Channel Avg", difficulty: "Hard" }
      ];
      titleHooks = [
        `This ${kw1} secret changed my entire process...`,
        `I stopped doing ${kw2} and did this instead.`,
        `The ugly truth about ${kw3} in 2026.`
      ];
      contentStyles = [
        "Fast-paced visual edits showing real-time setup or results.",
        "Clear diagram-based breakdowns of abstract concepts.",
        "First-person case study narration with strong progress bars."
      ];
      break;

    case "finance":
      overviewSummary = `Market intent for financial topics like ${kw1} and ${kw2} is extremely high. Audiences are searching for budgeting tips and market analysis, with growing questions around ${kw3} strategies.`;
      quickWins = [
        { idea: `Create a 60-second market update or side-hustle tip on ${kw1}`, why: "Short finance advice has high retention rates on TikTok/Shorts.", effort: "low", timing: "Next 48h" },
        { idea: `Re-optimize older video titles about ${kw2}`, why: "Capitalize on search interest during market swings.", effort: "low", timing: "This week" },
        { idea: `Reply to subscriber comments asking about ${kw3} tools`, why: "Establishes authority and drives channel credibility.", effort: "low", timing: "Ongoing" }
      ];
      emergingTrends = [
        { topic: `Passive Income Streams with ${kw1}`, viralScore: 85, momentum: "hot", difficulty: "medium", opportunity: "Highly engaging formatting showing proof of earnings.", actionableIdea: `A breakdown of my passive income portfolio focusing on ${kw1}.`, timeWindow: "15 Days", estimatedViews: "300K+" },
        { topic: `The Truth About the ${kw2} Market`, viralScore: 78, momentum: "rising", difficulty: "easy", opportunity: "Provide calm, factual advice during volatile market shifts.", actionableIdea: `An analytical view of current market cycles for ${kw2}.`, timeWindow: "30 Days", estimatedViews: "180K+" },
        { topic: `Smart ${kw3} Investing Rules`, viralScore: 69, momentum: "stable", difficulty: "hard", opportunity: "Step-by-step tutorial guiding viewers on risk management.", actionableIdea: `Step-by-step tutorial on how to safely build a position in ${kw3}.`, timeWindow: "45 Days", estimatedViews: "110K+" }
      ];
      videoIdeas = [
        { title: `I Tried the Best ${kw1} Side Hustle for 30 Days (My Real Profit)`, description: "A transparent breakdown of setup, hours worked, and exactly how much money was made.", predictedViews: "2.8x Channel Avg", difficulty: "Medium" },
        { title: `The Ultimate ${kw2} Strategy for Beginners (Step-by-Step)`, description: "A beginner-friendly guide covering fundamental analysis and portfolio allocation.", predictedViews: "2.1x Channel Avg", difficulty: "Easy" },
        { title: `Is ${kw3} a Scam? (The Ugly Truth They Won't Tell You)`, description: "An investigative report exposing hidden fees, risks, and realistic expectations.", predictedViews: "1.9x Channel Avg", difficulty: "Hard" }
      ];
      titleHooks = [
        `How I make $1,000/month with ${kw1}...`,
        `The ${kw2} mistake that cost me thousands.`,
        `Don't buy ${kw3} before watching this.`
      ];
      contentStyles = [
        "Clean, minimalistic chart layouts with large callouts.",
        "Talking-head segments backed by real-time bank/portfolio logs.",
        "Text overlays detailing cost of failure vs cost of action."
      ];
      break;

    case "lifestyle":
      overviewSummary = `Audiences are highly engaged with lifestyle content featuring ${kw1} and ${kw2}. Strongest opportunities are in routine vlogs, travel diaries, and recipes highlighting ${kw3}.`;
      quickWins = [
        { idea: `Post a 60-second aesthetic routine or recipe featuring ${kw1}`, why: "Short-form aesthetic clips gain high organic reach on vertical feeds.", effort: "low", timing: "Next 24h" },
        { idea: `Update thumbnails/titles on popular ${kw2} videos`, why: "Fresh visuals on high-retention vlogs boost CTR.", effort: "low", timing: "This week" },
        { idea: `Ask viewers for their favorite ${kw3} tips in the comments`, why: "Boosts comment volume and signals search algorithm.", effort: "low", timing: "Ongoing" }
      ];
      emergingTrends = [
        { topic: `Aesthetic Morning Routines with ${kw1}`, viralScore: 87, momentum: "hot", difficulty: "easy", opportunity: "Highly shareable aesthetic lifestyle clips.", actionableIdea: `A calm, visual morning routine vlog using ${kw1}.`, timeWindow: "15 Days", estimatedViews: "280K+" },
        { topic: `Healthy ${kw2} Meal Preps`, viralScore: 74, momentum: "rising", difficulty: "medium", opportunity: "High-retention culinary hacks that save time/money.", actionableIdea: `Prepping a week of healthy, budget-friendly meals featuring ${kw2}.`, timeWindow: "30 Days", estimatedViews: "140K+" },
        { topic: `Solo Travel Guides to ${kw3}`, viralScore: 68, momentum: "stable", difficulty: "medium", opportunity: "High search volume for vacation planning and packing lists.", actionableIdea: `A cinematically shot solo travel guide exploring ${kw3}.`, timeWindow: "45 Days", estimatedViews: "90K+" }
      ];
      videoIdeas = [
        { title: `I Spent 24 Hours Only eating/doing ${kw1} (Extreme Challenge)`, description: "A fun, fast-paced vlog documenting the challenges of this lifestyle test.", predictedViews: "3.2x Channel Avg", difficulty: "Medium" },
        { title: `The Ultimate ${kw2} Guide for a Productive Week`, description: "Sharing time management habits, workspace organization, and daily routines.", predictedViews: "2.3x Channel Avg", difficulty: "Easy" },
        { title: `How to Make the Perfect ${kw3} at Home (Save Money)`, description: "A step-by-step tutorial showing my secret recipe/setup for this popular topic.", predictedViews: "1.9x Channel Avg", difficulty: "Easy" }
      ];
      titleHooks = [
        `My simple ${kw1} routine that changed everything...`,
        `How I style my life around ${kw2}.`,
        `I visited ${kw3} alone and here's what happened.`
      ];
      contentStyles = [
        "Warm, cozy aesthetic edits with ambient background lo-fi music.",
        "ASMR style natural audio cuts without talking.",
        "Calm voiceover tracks narration paired with rapid typography grids."
      ];
      break;

    default:
      overviewSummary = `The content space surrounding ${kw1} and ${kw2} is experiencing high audience interest. Opportunities lie in short-form adaptations and deep-dives into ${kw3}.`;
      quickWins = [
        { idea: `Create a 60-second summary on ${kw1} trends`, why: "Vertical clips for this topic have high organic reach.", effort: "low", timing: "Next 48h" },
        { idea: `Re-optimize title hooks for older videos about ${kw2}`, why: "Spikes in search volume for this query can drive legacy traffic.", effort: "low", timing: "This week" },
        { idea: `Reply to recent community questions on ${kw3}`, why: "Viewer interactions build strong subscriber communities.", effort: "low", timing: "Ongoing" }
      ];
      emergingTrends = [
        { topic: `The New Way to Master ${kw1}`, viralScore: 80, momentum: "hot", difficulty: "medium", opportunity: "Viewers looking for shortcut tutorials that work.", actionableIdea: `A step-by-step breakdown on how to start learning ${kw1} today.`, timeWindow: "15 Days", estimatedViews: "200K+" },
        { topic: `Behind the Scenes of ${kw2}`, viralScore: 72, momentum: "rising", difficulty: "easy", opportunity: "Build deep subscriber trust by showing creator setup/tools.", actionableIdea: `A transparent behind-the-scenes look at how we build/create ${kw2}.`, timeWindow: "30 Days", estimatedViews: "110K+" },
        { topic: `The Future of ${kw3} in 2026`, viralScore: 66, momentum: "stable", difficulty: "hard", opportunity: "Forward-looking analysis sets you up as an industry expert.", actionableIdea: `Analyzing emerging patterns and where the ${kw3} space is headed.`, timeWindow: "45 Days", estimatedViews: "75K+" }
      ];
      videoIdeas = [
        { title: `I Tried Every ${kw1} Strategy for 30 Days (Here's the Best One)`, description: "A challenge format documenting the experiment, results, and key lessons.", predictedViews: "3x Channel Avg", difficulty: "Medium" },
        { title: `The Ultimate ${kw2} Guide for Beginners (No Experience Required)`, description: "A comprehensive, visual roadmap covering tools and step-by-step setup.", predictedViews: "2x Channel Avg", difficulty: "Easy" },
        { title: `Why Most People Fail at ${kw3} (And How to Fix It)`, description: "An analytical breakdown of common mistakes and actionable solutions.", predictedViews: "1.8x Channel Avg", difficulty: "Hard" }
      ];
      titleHooks = [
        `This ${kw1} secret changed my entire process...`,
        `I stopped doing ${kw2} and did this instead.`,
        `The ugly truth about ${kw3} in 2026.`
      ];
      contentStyles = [
        "Fast-paced visual edits showing real-time setup or results.",
        "Clear diagram-based breakdowns of abstract concepts.",
        "First-person case study narration with strong progress bars."
      ];
      break;
  }

  return {
    summary: { totalVideosAnalyzed: views.length || 50 },
    insights: {
      overview: {
        viralPotential: "High",
        marketMomentum: "Rising",
        trendingTopics: 8,
        summary: overviewSummary
      },
      quickWins,
      emergingTrends,
      videoIdeas,
      viralPatterns: {
        titleHooks,
        contentStyles
      }
    }
  };
}

async function generateRealTrendsAndIdeas(youtubeChannel, youtubeVideos) {
  const recentVideos = youtubeVideos || [];
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 1. AI generates search queries based on user's videos
  let searchQueries = [];
  if (youtubeChannel && recentVideos.length > 0) {
    const prompt = `You are a YouTube market researcher. Based on the following recent videos from the channel "${youtubeChannel.snippet?.title || youtubeChannel.title || ''}", generate 5 highly specific YouTube search queries that will help us find the CURRENT trending competitors and viral videos in this exact niche.
    
Recent Videos:
${recentVideos.slice(0, 10).map(v => `- ${v.snippet?.title || v.title || ''}`).join('\n')}

Do not generate generic queries. Generate specific, trend-focused queries.`;

    const { object } = await generateObjectWithFallback({
      modelName: 'openai/gpt-oss-120b',
      schema: searchQueriesSchema,
      prompt,
      temperature: 0.7,
    });
    searchQueries = object.queries;
  } else {
    const niche = youtubeChannel?.snippet?.title ? youtubeChannel.snippet.title.split(' ')[0] : 'tech';
    searchQueries.push(`${niche} trending 2026`, `${niche} viral`, `how to ${niche} 2026`);
  }

  // 2. Search YouTube using queries
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

  // 3. Calculate metrics & identify top competitors
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
    if (v.channelId === youtubeChannel.id) continue;
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

  // 4. AI synthesizes Trend Radar
  let avgViews = 0;
  if (recentVideos.length > 0) {
    const totalViews = recentVideos.reduce((sum, v) => sum + parseInt(v.statistics?.viewCount || v.views || 0, 10), 0);
    avgViews = Math.round(totalViews / recentVideos.length);
  }
  const subCount = parseInt(youtubeChannel?.statistics?.subscriberCount || 0);

  const currentDate = new Date().toISOString().split('T')[0];
  const prompt = `You are an elite YouTube Trend Analyst AI. Create a highly customized Trend Radar analysis for the channel "${youtubeChannel?.snippet?.title || youtubeChannel?.title || 'General'}".
Current Date: ${currentDate}

USER CHANNEL CONTEXT:
Subscriber Count: ${subCount > 0 ? subCount.toLocaleString() : 'Unknown'}
Average Views per Video: ${avgViews > 0 ? avgViews.toLocaleString() : 'New/Small Channel'}
Recent Videos: ${recentVideos.slice(0, 5).map(v => `"${v.snippet?.title || v.title || ''}"`).join(', ')}

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

  const { object } = await generateObjectWithFallback({
    modelName: 'openai/gpt-oss-120b',
    schema: trendSchema,
    prompt,
    temperature: 0.7,
  });

  object.summary.totalVideosAnalyzed = videosWithMetrics.length > 0 ? videosWithMetrics.length : 120;

  return object;
}

export async function POST(req) {
  try {
    const isDemo = await getIsDemoMode();
    let userId = null;

    if (!isDemo) {
      const authResult = await auth();
      userId = authResult.userId;
      if (!userId) return apiError(new Error("Unauthorized"), 401);

      const user = await currentUser();
      const userEmail = user?.emailAddresses?.[0]?.emailAddress;
      if (userEmail !== "thecxsmic@gmail.com") {
        return apiError(new Error("Forbidden: Admin access required"), 403);
      }
    }

    const { query } = await req.json();
    if (!query) {
      return apiError(new Error("Query (Channel ID or handle) is required"), 400);
    }

    console.log(`[Admin Share API] Generating shareable analysis for query: ${query}`);

    // If demo mode is active, handle mock channel and videos
    if (isDemo) {
      const demoChannel = MOCK_CHANNELS[query] || MOCK_CHANNELS["UC-techvibeai123"];
      const demoVideos = generateMockVideos(demoChannel.id);
      
      await saveChannel(demoChannel, demoVideos);
      await saveTrendRadar(demoChannel.id, MOCK_TREND_RADAR);
      
      return apiSuccess({
        success: true,
        channelId: demoChannel.id,
        title: demoChannel.title || "Unknown Channel"
      });
    }

    // 1. Check local Turso database first to save quota
    let youtubeChannel = await getChannel(query);
    let youtubeVideos = [];

    if (youtubeChannel) {
      console.log(`[Admin Share API] Found channel in DB cache: ${youtubeChannel.id}`);
      youtubeVideos = await getChannelVideos(youtubeChannel.id);
    } else {
      // 2. Fetch from YouTube
      console.log(`[Admin Share API] Channel not in DB. Fetching from YouTube...`);
      const channels = await fetchYouTubeChannels(query);
      if (!channels || channels.length === 0) {
        return apiError(new Error("Channel not found on YouTube"), 404);
      }
      youtubeChannel = channels[0];

      // 3. Fetch recent videos
      console.log(`[Admin Share API] Fetching videos for channel: ${youtubeChannel.id}`);
      const { items: videos } = await fetchChannelVideos(youtubeChannel.id, 50);
      youtubeVideos = videos;

      // 4. Save channel and videos to local database
      await saveChannel(youtubeChannel, youtubeVideos);
      console.log(`[Admin Share API] Successfully saved channel and ${youtubeVideos?.length || 0} videos to DB`);
    }

    // 5. Generate real trends / ideas using LLM, with fallback to local template if rate-limited or fails
    let trendsData;
    try {
      trendsData = await generateRealTrendsAndIdeas(youtubeChannel, youtubeVideos);
      console.log(`[Admin Share API] Successfully generated trend_radar data using Real AI`);
    } catch (llmErr) {
      console.warn(`[Admin Share API] Real AI generation failed, falling back to static template. Error:`, llmErr);
      trendsData = generateLocalTrendsAndIdeas(youtubeChannel, youtubeVideos);
    }

    await saveTrendRadar(youtubeChannel.id, trendsData);
    console.log(`[Admin Share API] Successfully saved trend_radar data to database`);

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
