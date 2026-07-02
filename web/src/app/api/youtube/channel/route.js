import { channelSearchPipeline } from "@/lib/search/channel-pipeline";
import { fetchYouTubeChannels } from "@/lib/youtube/channels";
import { searchChannelsLocal, getTrendRadar } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode, MOCK_CHANNELS, generateMockVideos } from "@/lib/utils/demoMock";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const channelId = searchParams.get("channelId");
    const pageToken = searchParams.get("pageToken");
    
    if (await getIsDemoMode()) {
      if (channelId) {
        const channel = MOCK_CHANNELS[channelId] || MOCK_CHANNELS["UC-techvibeai123"];
        const videos = generateMockVideos(channel.id);
        return apiSuccess({
          channel,
          videos,
          source: "youtube",
          nextPageToken: null
        });
      }

      if (!query) {
        return apiError(new Error("Query parameter 'q' or 'channelId' is required"), 400);
      }

      const q = query.toLowerCase();
      const filtered = Object.values(MOCK_CHANNELS)
        .filter(c => c.title.toLowerCase().includes(q) || c.custom_url.toLowerCase().includes(q));
      
      const items = filtered.length > 0 ? filtered : Object.values(MOCK_CHANNELS);
      return apiSuccess({
        items: items.map(c => ({ ...c, source: 'youtube' }))
      });
    }

    // 1. If channelId is provided, do a deep analysis (Pipeline)
    if (channelId) {
      const results = await channelSearchPipeline(channelId, pageToken);
      if (!results) return apiError(new Error("Channel not found"), 404);

      try {
        const trendRadar = await getTrendRadar(channelId);
        if (trendRadar) {
          results.trends = trendRadar.data;
        }

        if (results.channel && results.videos) {
          results.competitors = await getCompetitorsForChannel(results.channel, results.videos);
        }
      } catch (err) {
        console.error("[Channel API] Failed to fetch secondary data:", err);
      }

      return apiSuccess(results);
    }

    // 2. Otherwise, do a broad search (Local + YouTube)
    if (!query) {
      return apiError(new Error("Query parameter 'q' or 'channelId' is required"), 400);
    }

    console.log(`[Channel API] Searching for: ${query}`);
    
    // Check local first
    const localChannels = await searchChannelsLocal(query);
    
    // Fetch from YouTube
    const youtubeChannels = await fetchYouTubeChannels(query);

    // Merge results, prioritizing local but removing duplicates
    const seenIds = new Set(localChannels.map(c => c.id));
    const merged = [
      ...localChannels.map(c => ({ ...c, source: 'turso' })),
      ...youtubeChannels
        .filter(c => !seenIds.has(c.id))
        .map(c => ({
          id: c.id,
          title: c?.snippet?.title || "Unknown Channel",
          custom_url: c?.snippet?.customUrl || "",
          thumbnail: c?.snippet?.thumbnails?.high?.url || c?.snippet?.thumbnails?.medium?.url || c?.snippet?.thumbnails?.default?.url || null,
          statistics: c?.statistics || {},
          source: 'youtube'
        }))
    ];

    return apiSuccess({ items: merged });
  } catch (error) {
    console.error("[Channel API] Error:", error);
    return apiError(error);
  }
}

async function fetchChannelDetailsList(ids) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "snippet,statistics");
    url.searchParams.set("id", ids.filter(Boolean).join(","));
    url.searchParams.set("key", apiKey);
    
    const res = await fetch(url.toString());
    const data = await res.json();
    return (data.items || []).map(c => ({
      id: c.id,
      title: c?.snippet?.title || "Unknown Channel",
      custom_url: c?.snippet?.customUrl || "",
      thumbnail: c?.snippet?.thumbnails?.high?.url || c?.snippet?.thumbnails?.medium?.url || null,
      statistics: c?.statistics || {}
    }));
  } catch (err) {
    console.error("Failed to fetch elite channel details:", err);
    return [];
  }
}

async function getCompetitorsForChannel(channel, videos) {
  try {
    if (!videos || videos.length === 0) return [];
    
    const topVideos = [...videos]
      .sort((a, b) => parseInt(b.statistics?.viewCount || b.views || 0, 10) - parseInt(a.statistics?.viewCount || a.views || 0, 10))
      .slice(0, 3);
      
    const nicheQuery = topVideos
      .map(v => {
        const title = v.snippet?.title || v.title || "";
        return title.replace(/[^\w\s]/gi, '').split(/\s+/).slice(0, 3).join(' ');
      })
      .join(' ');
      
    let results = await fetchYouTubeChannels(nicheQuery);

    // Cascade 1: Use top video title keywords
    if (!results || results.length === 0) {
      const topTitle = topVideos[0].snippet?.title || topVideos[0].title || "";
      const fallbackQuery = topTitle.replace(/[^\w\s]/gi, '').split(/\s+/).slice(0, 4).join(' ');
      if (fallbackQuery.trim()) {
        console.log(`[Competitor API] Primary query returned 0. Cascading to: ${fallbackQuery}`);
        results = await fetchYouTubeChannels(fallbackQuery);
      }
    }

    // Cascade 2: Use base channel title
    if (!results || results.length === 0) {
      const channelTitle = channel.snippet?.title || channel.title || "";
      if (channelTitle.trim()) {
        console.log(`[Competitor API] Falling back to channel title: ${channelTitle}`);
        results = await fetchYouTubeChannels(channelTitle);
      }
    }

    // Cascade 3: Use general creator fallback
    if (!results || results.length === 0) {
      console.log(`[Competitor API] Using default fallback query 'creator vlogs'`);
      results = await fetchYouTubeChannels("creator vlogs");
    }

    const currentSubs = parseInt(channel.statistics?.subscriberCount || 0, 10);
    const filtered = (results || []).filter(c => c.id !== channel.id);
    
    const mapped = filtered.map(c => ({
      id: c.id,
      title: c?.snippet?.title || c.title || "Unknown Channel",
      custom_url: c?.snippet?.customUrl || "",
      thumbnail: c?.snippet?.thumbnails?.high?.url || c?.snippet?.thumbnails?.medium?.url || c?.snippet?.thumbnails?.default?.url || null,
      statistics: c?.statistics || {}
    }));

    // Detect niche
    let niche = "general";
    const titleTokens = (channel.snippet?.title || channel.title || "" + " " + topVideos.map(v => v.snippet?.title || v.title || "").join(" ")).toLowerCase();
    
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

    const ELITE_CREATORS = {
      automotive: [
        { id: "UCUhFaUpnq31m6TNX2VKVSVA", title: "carwow", subs: 9000000 },
        { id: "UCG72WbiCvdB6JKU-3YRP8Kg", title: "Doug DeMuro", subs: 4500000 },
        { id: "UCL6JmiMXKoXS6bpP1D3bk8g", title: "Donut Media", subs: 8600000 },
        { id: "UCKSVUHI9rbbkXhvAXK-2uxA", title: "Supercar Blondie", subs: 11000000 },
        { id: "UCes1EvRjcKU4sY_UEavndBw", title: "ChrisFix", subs: 10200000 }
      ],
      gaming: [
        { id: "UC-lHJZR3Gqxm24_Vd_AJ5Yw", title: "PewDiePie", subs: 111000000 },
        { id: "UC7_YxT-KID8yTOQzNew5XCg", title: "Markiplier", subs: 36000000 },
        { id: "UCYzPXprvl5Y-Sf0g4vX-m6g", title: "Jacksepticeye", subs: 30000000 },
        { id: "UCAW-NpUFkMyCNrvRSSGIvDQ", title: "Ninja", subs: 23500000 },
        { id: "UCS5Oz6CHmeoF7vSad0qqXfw", title: "DanTDM", subs: 28500000 }
      ],
      tech: [
        { id: "UCBJycsmduvYEL83R_U4JriQ", title: "Marques Brownlee", subs: 18600000 },
        { id: "UCXuqSBlHAE6Xw-yeJA0Tunw", title: "Linus Tech Tips", subs: 15600000 },
        { id: "UCsTcErHg8oDvUnTzoqsYeNw", title: "Unbox Therapy", subs: 21500000 },
        { id: "UCWFKCr40YwOZQx8FHU_ZqqQ", title: "JerryRigEverything", subs: 8500000 },
        { id: "UCXGgrKt94gR6lmN4aN3mYTg", title: "Austin Evans", subs: 5300000 }
      ],
      finance: [
        { id: "UCV6KDgJskWaEckne5aPA0aQ", title: "Graham Stephan", subs: 4600000 },
        { id: "UCoOae5nYA7VqaXzerajD0lg", title: "Ali Abdaal", subs: 5200000 },
        { id: "UCGy7SkBjcIAgTiwkXEtPnYg", title: "Andrei Jikh", subs: 2300000 },
        { id: "UCUvvj5lwue7PspotMDjk5UA", title: "Meet Kevin", subs: 1900000 },
        { id: "UCxgAuX3XZROujMmGphN_scA", title: "Mark Tilbury", subs: 1400000 }
      ],
      lifestyle: [
        { id: "UCX6OQ3DkcsbYNE6H8uQQuVA", title: "MrBeast", subs: 300000000 },
        { id: "UCRijo3ddMTht_IHyNSNXpNQ", title: "Dude Perfect", subs: 60000000 },
        { id: "UCtinbF-Q-fVthA0qrFQTgXQ", title: "Casey Neistat", subs: 12600000 },
        { id: "UCG8rbF3g2AMX70yOd8vqIZg", title: "Logan Paul", subs: 23600000 }
      ],
      general: [
        { id: "UCX6OQ3DkcsbYNE6H8uQQuVA", title: "MrBeast", subs: 300000000 },
        { id: "UCRijo3ddMTht_IHyNSNXpNQ", title: "Dude Perfect", subs: 60000000 },
        { id: "UCtinbF-Q-fVthA0qrFQTgXQ", title: "Casey Neistat", subs: 12600000 }
      ]
    };

    let peers = mapped.filter(c => {
      const s = parseInt(c.statistics?.subscriberCount || 0, 10);
      return s >= currentSubs * 0.4 && s <= currentSubs * 2.5;
    });

    let growthTargets = mapped.filter(c => {
      const s = parseInt(c.statistics?.subscriberCount || 0, 10);
      return s > currentSubs * 2.5 && s <= currentSubs * 10;
    });

    let marketLeaders = mapped.filter(c => {
      const s = parseInt(c.statistics?.subscriberCount || 0, 10);
      return s > currentSubs * 10;
    });

    // If channel is large (>= 1M subs) and has missing categories, fallback to elite lists
    if (currentSubs >= 1000000) {
      const nicheList = ELITE_CREATORS[niche] || ELITE_CREATORS.general;

      if (peers.length === 0) {
        const closestPeers = nicheList
          .filter(c => c.id !== channel.id && c.subs >= currentSubs * 0.1)
          .sort((a, b) => Math.abs(a.subs - currentSubs) - Math.abs(b.subs - currentSubs))
          .slice(0, 2);
          
        if (closestPeers.length > 0) {
          const fetched = await fetchChannelDetailsList(closestPeers.map(p => p.id));
          peers = [...peers, ...fetched];
        }
      }

      if (growthTargets.length === 0) {
        const targets = nicheList
          .filter(c => c.id !== channel.id && c.subs > currentSubs * 1.2 && c.subs <= currentSubs * 10)
          .slice(0, 2);
          
        if (targets.length > 0) {
          const fetched = await fetchChannelDetailsList(targets.map(p => p.id));
          growthTargets = [...growthTargets, ...fetched];
        }
      }

      if (marketLeaders.length === 0) {
        let leaders = nicheList
          .filter(c => c.id !== channel.id && c.subs > currentSubs * 5)
          .slice(0, 2);
          
        if (leaders.length === 0) {
          leaders = nicheList
            .filter(c => c.id !== channel.id && c.subs >= currentSubs * 0.1)
            .sort((a, b) => b.subs - a.subs)
            .slice(0, 2);
        }
        
        if (leaders.length > 0) {
          const fetched = await fetchChannelDetailsList(leaders.map(p => p.id));
          marketLeaders = [...marketLeaders, ...fetched];
        }
      }
    }

    // fallback slice
    peers = peers.slice(0, 3);
    growthTargets = growthTargets.slice(0, 3);
    marketLeaders = marketLeaders.slice(0, 3);

    const topPicks = [];
    if (peers.length > 0) topPicks.push({ ...peers[0], matchType: 'PEER', matchReason: 'Direct size parity' });
    if (growthTargets.length > 0) topPicks.push({ ...growthTargets[0], matchType: 'TARGET', matchReason: 'Growth benchmark' });
    if (marketLeaders.length > 0) topPicks.push({ ...marketLeaders[0], matchType: 'LEADER', matchReason: 'Niche authority' });

    let finalResults = topPicks.length > 0 ? [...topPicks, ...mapped.filter(c => !topPicks.find(p => p.id === c.id))] : mapped;

    // Filter out low quality matches (sub-10k or tiny relative scale) for large channels (1M+)
    if (currentSubs >= 1000000) {
      finalResults = finalResults.filter(c => {
        const s = parseInt(c.statistics?.subscriberCount || 0, 10);
        // Keep if it has at least 10% of current channel's subs, or is one of our top picks
        return s >= currentSubs * 0.1 || topPicks.some(p => p.id === c.id);
      });
    }

    return finalResults;
  } catch (err) {
    console.error("Error generating competitors on backend:", err);
    return [];
  }
}

