import { NextResponse } from "next/server";
import { channelSearchPipeline } from "@/lib/search/channel-pipeline";
import { 
  searchChannelsLocal, 
  getCompetitors, 
  saveCompetitors, 
  deleteCompetitorCache,
  getStoredCompetitorGraph,
  saveCompetitorGraph,
  deleteCompetitorGraph 
} from "@/lib/cache/turso";
import { fetchChannelVideos } from "@/lib/youtube/channels";
import { getYouTubeApiKey } from "@/lib/youtube/apiKeyManager";
import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode, MOCK_CHANNELS } from "@/lib/utils/demoMock";

/**
 * Production Competitor Discovery Engine (Mirrors test-competitors.mjs)
 * 
 * 1. FIRST TIME PER CHANNEL (or when Refresh Intel is clicked):
 *    a) Get channel videos & sort by viewCount to get top 3 popular videos.
 *    b) Build up to 3 targeted high-signal queries from video titles + niche context.
 *    c) Search YouTube for `type=video` (extracting creator channel IDs of top video authors).
 *    d) Filter out low-quality/bot/fan accounts (< 500 subs or reaction channels).
 *    e) Save discovered competitor IDs PERMANENTLY to `channel_competitors_graph`.
 * 
 * 2. SUBSEQUENT RESCANS & VIEWS:
 *    a) Bypasses all search API calls (0 Search Quota).
 *    b) Loads competitor IDs from `channel_competitors_graph`.
 *    c) Fetches fresh live subscriber stats via 1 single batch call (1 quota unit total).
 * 
 * 3. REFRESH INTEL BUTTON (`force=true`):
 *    a) Deletes `competitor_cache` AND `channel_competitors_graph`.
 *    b) Re-runs the video search pipeline to discover new candidates.
 *    c) Re-saves the fresh graph in Turso DB.
 */

const CURATED_CREATORS_BY_NICHE = {
  tech: [
    { id: "UCsbjURrPqeZg9351C4WULqQ", title: "Fireship" },
    { id: "UC29ju8bIPH5as8OGnQzwJyA", title: "Traversy Media" },
    { id: "UC8butISFwT-Wl7EV0hUK0BQ", title: "freeCodeCamp.org" },
    { id: "UCsTcErHg8oDvUnTzoqsYeNw", title: "Unbox Therapy" },
    { id: "UCBJycsmduvYEL83R_U4JriQ", title: "Marques Brownlee" },
    { id: "UCXuqSBlHAE6Xw-yeJA0Tunw", title: "Linus Tech Tips" }
  ],
  gaming: [
    { id: "UC-lHJZR3Gqxm24_Vd_AJ5Yw", title: "PewDiePie" },
    { id: "UC7_YxT-KID8yTOQzNew5XCg", title: "Markiplier" },
    { id: "UCYzPXprvl5Y-Sf0g4vX-m6g", title: "Jacksepticeye" },
    { id: "UCAW-NpUFkMyCNrvRSSGIvDQ", title: "Ninja" }
  ],
  finance: [
    { id: "UCV6KDgJskWaEckne5aPA0aQ", title: "Graham Stephan" },
    { id: "UCoOae5nYA7VqaXzerajD0lg", title: "Ali Abdaal" },
    { id: "UCGy7SkBjcIAgTiwkXEtPnYg", title: "Andrei Jikh" },
    { id: "UCUvvj5lwue7PspotMDjk5UA", title: "Meet Kevin" }
  ],
  automotive: [
    { id: "UCUhFaUpnq31m6TNX2VKVSVA", title: "carwow" },
    { id: "UCG72WbiCvdB6JKU-3YRP8Kg", title: "Doug DeMuro" },
    { id: "UCL6JmiMXKoXS6bpP1D3bk8g", title: "Donut Media" },
    { id: "UCes1EvRjcKU4sY_UEavndBw", title: "ChrisFix" }
  ],
  general: [
    { id: "UCX6OQ3DkcsbYNE6H8uQQuVA", title: "MrBeast" },
    { id: "UCRijo3ddMTht_IHyNSNXpNQ", title: "Dude Perfect" },
    { id: "UCtinbF-Q-fVthA0qrFQTgXQ", title: "Casey Neistat" }
  ]
};

function detectNiche(channel, popularVideos) {
  const title = channel.snippet?.title || channel.title || "";
  const desc = channel.snippet?.description || channel.description || "";
  const keywords = channel.brandingSettings?.channel?.keywords || "";
  const topicCat = (channel.topicDetails?.topicCategories || []).join(" ");
  const videoTitles = popularVideos.map(v => v.snippet?.title || v.title || "").join(" ");

  const combined = `${title} ${desc} ${keywords} ${topicCat} ${videoTitles}`.toLowerCase();

  if (/\b(code|coding|programming|software|developer|app|web|website|react|nextjs|javascript|python|css|html|dino|tech|bot|build app|game dev|indie dev)\b/i.test(combined)) {
    return "tech";
  } else if (/\b(game|games|gaming|gameplay|minecraft|fortnite|roblox|ps5|xbox|streamer)\b/i.test(combined)) {
    return "gaming";
  } else if (/\b(money|finance|crypto|stocks|invest|investing|business|trading)\b/i.test(combined)) {
    return "finance";
  } else if (/\b(car|cars|auto|driving|engine|vehicle|exhaust|porsche|bmw)\b/i.test(combined)) {
    return "automotive";
  }
  return "general";
}

function buildHighSignalQuery(videoTitle, niche) {
  if (!videoTitle) return "";
  const clean = videoTitle.replace(/[^\w\s]/gi, ' ');
  const STOP_WORDS = new Set([
    "how", "to", "in", "and", "or", "the", "a", "an", "is", "for", "with", "on", "at", "by",
    "from", "this", "that", "it", "my", "your", "i", "you", "we", "they", "of", "best", "top",
    "video", "channel", "official", "new", "2024", "2025", "2026", "vlog", "full", "hd", "free",
    "ever", "purpose", "needed", "seconds", "here", "real", "life"
  ]);

  const words = clean.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));
  let query = words.slice(0, 4).join(" ");
  if (niche === "tech" && !/\b(code|coding|dev|programming|app|web|tech|website|software)\b/i.test(query)) {
    query += " coding web dev";
  }
  return query.trim();
}

// Search YouTube by video query and extract candidate creator channel IDs (Identical to test-competitors.mjs)
async function searchCandidatesByVideo(query) {
  if (!query || !query.trim()) return [];
  try {
    const apiKey = await getYouTubeApiKey("search.list");
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "10");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!res.ok || !data.items) return [];

    const channelIds = data.items.map(item => item.snippet?.channelId).filter(Boolean);
    return [...new Set(channelIds)];
  } catch (err) {
    console.error("[Competitor Engine] Video candidate search error:", err);
    return [];
  }
}

async function fetchChannelDetailsBatch(ids) {
  if (!ids || ids.length === 0) return [];
  try {
    const apiKey = await getYouTubeApiKey("channels.list");
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "snippet,statistics,contentDetails,topicDetails");
    url.searchParams.set("id", ids.slice(0, 50).join(","));
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();
    return (data.items || []).map(c => ({
      id: c.id,
      title: c?.snippet?.title || "Unknown Channel",
      custom_url: c?.snippet?.customUrl || "",
      thumbnail: c?.snippet?.thumbnails?.high?.url || c?.snippet?.thumbnails?.medium?.url || c?.snippet?.thumbnails?.default?.url || null,
      statistics: c?.statistics || {},
      snippet: c?.snippet || {},
      contentDetails: c?.contentDetails || {},
      topicDetails: c?.topicDetails || {}
    }));
  } catch (err) {
    console.error("[Competitor Engine] Batch details fetch error:", err);
    return [];
  }
}

export async function getMinimalQuotaCompetitors(channel, videos = [], forceRefresh = false) {
  try {
    if (!channel) return [];

    const channelId = channel.id;
    const currentSubs = parseInt(channel.statistics?.subscriberCount || 0, 10);

    // ── STEP 1: FORCE REFRESH - PURGE BOTH CACHES ────────────────────────────
    if (forceRefresh) {
      console.log(`[Competitor Engine] Refresh Intel requested for ${channelId}. Invalidating graph & short-term cache.`);
      await deleteCompetitorCache(channelId);
      await deleteCompetitorGraph(channelId);
    } else {
      // Check short-term cache (0 quota)
      const cached = await getCompetitors(channelId);
      if (cached && cached.data && cached.data.length > 0) {
        console.log(`[Competitor Engine] Serving short-term cached competitors for ${channelId} (0 quota)`);
        return cached.data;
      }
    }

    // ── STEP 2: CHECK PERMANENT STORED GRAPH (1 BATCH QUOTA UNIT) ─────────────
    if (!forceRefresh) {
      const storedGraph = await getStoredCompetitorGraph(channelId);
      if (storedGraph && storedGraph.competitor_ids && storedGraph.competitor_ids.length > 0) {
        console.log(`[Competitor Engine] Using permanent graph for ${channelId} (${storedGraph.competitor_ids.length} rivals).`);
        console.log(`[Competitor Engine] Rescanning live subscriber stats via 1 batch call (1 quota unit total, 0 search calls)`);

        const freshChannels = await fetchChannelDetailsBatch(storedGraph.competitor_ids);
        if (freshChannels.length > 0) {
          const mappedRivals = freshChannels.map(c => {
            const s = parseInt(c.statistics?.subscriberCount || 0, 10);
            let matchType = "Rising channel";
            let matchReason = "Discovered rival";

            if (currentSubs > 0) {
              if (s >= currentSubs * 0.2 && s <= currentSubs * 3.0) {
                matchType = "PEER";
                matchReason = "Direct size parity";
              } else if (s > currentSubs * 3.0 && s <= currentSubs * 15.0) {
                matchType = "TARGET";
                matchReason = "Growth benchmark";
              } else if (s > currentSubs * 15.0 || currentSubs < 1000) {
                matchType = "LEADER";
                matchReason = "Niche authority";
              }
            }
            return { ...c, matchType, matchReason };
          }).sort((a, b) => parseInt(b.statistics?.subscriberCount || 0) - parseInt(a.statistics?.subscriberCount || 0));

          // Fetch top video uploads for each rival channel (up to 10)
          for (const comp of mappedRivals.slice(0, 8)) {
            try {
              const vidResult = await fetchChannelVideos(comp.id, 10);
              comp.videos = (vidResult.items || []).map(v => ({
                id: v.id,
                title: v.snippet?.title || "",
                views: parseInt(v.statistics?.viewCount || 0, 10),
                likes: parseInt(v.statistics?.likeCount || 0, 10),
                statistics: v.statistics || {},
                snippet: v.snippet || {}
              }));
            } catch (e) {
              comp.videos = [];
            }
          }

          await saveCompetitors(channelId, mappedRivals).catch(() => {});
          return mappedRivals;
        }
      }
    }

    // ── STEP 3: INITIAL DISCOVERY PIPELINE (1st time per channel) ──────────────
    console.log(`[Competitor Engine] Initial discovery pipeline running for ${channelId}...`);

    let channelVideos = videos || [];
    if (channelVideos.length === 0) {
      try {
        const vidResult = await fetchChannelVideos(channelId, 25);
        channelVideos = vidResult.items || [];
      } catch (e) {
        console.error("Failed to fetch channel videos for discovery:", e);
      }
    }

    const popularVideos = [...channelVideos]
      .sort((a, b) => {
        const viewsA = parseInt(a.statistics?.viewCount || a.views || a.viewCount || 0, 10);
        const viewsB = parseInt(b.statistics?.viewCount || b.views || b.viewCount || 0, 10);
        return viewsB - viewsA;
      })
      .slice(0, 3);

    const niche = detectNiche(channel, popularVideos);
    console.log(`[Competitor Engine] Detected Niche: [ ${niche.toUpperCase()} ]`);

    // Build up to 3 targeted queries from popular video titles
    const searchQueries = [];
    popularVideos.forEach(v => {
      const vTitle = v.snippet?.title || v.title || "";
      const q = buildHighSignalQuery(vTitle, niche);
      if (q && !searchQueries.includes(q)) {
        searchQueries.push(q);
      }
    });

    if (searchQueries.length < 3) {
      const fallbackQ = `${niche} coding web dev project`;
      if (!searchQueries.includes(fallbackQ)) searchQueries.push(fallbackQ);
    }

    console.log(`[Competitor Engine] Running up to 3 popular video queries:`, searchQueries);

    const candidateIdsSet = new Set();

    for (const q of searchQueries.slice(0, 3)) {
      if (!q.trim()) continue;
      const foundIds = await searchCandidatesByVideo(q);
      foundIds.forEach(id => {
        if (id !== channelId) candidateIdsSet.add(id);
      });
    }

    // Include curated niche creators to guarantee high quality benchmark options
    const curatedPresets = CURATED_CREATORS_BY_NICHE[niche] || CURATED_CREATORS_BY_NICHE.general;
    curatedPresets.forEach(preset => {
      if (preset.id !== channelId) {
        candidateIdsSet.add(preset.id);
      }
    });

    const candidateIds = Array.from(candidateIdsSet).slice(0, 25);
    if (candidateIds.length === 0) return [];

    const detailedCandidates = await fetchChannelDetailsBatch(candidateIds);

    // High quality filtering (Exclude bot/fan/reaction accounts & accounts under sub bar)
    const MIN_SUBS_BAR = currentSubs >= 100000 ? 5000 : 500;
    const filteredCandidates = detailedCandidates.filter(c => {
      if (c.id === channelId) return false;
      const s = parseInt(c.statistics?.subscriberCount || 0, 10);
      if (s < MIN_SUBS_BAR) return false;

      const titleLower = (c.snippet?.title || c.title || "").toLowerCase();
      if (/\b(fan|repost|clip|asmongold|reaction|reacts|edit|status|whatsapp)\b/i.test(titleLower)) return false;
      return true;
    });

    const peers = [];
    const targets = [];
    const leaders = [];

    filteredCandidates.forEach(c => {
      const s = parseInt(c.statistics?.subscriberCount || 0, 10);
      if (currentSubs > 0 && s >= currentSubs * 0.2 && s <= currentSubs * 3.0) {
        peers.push({ ...c, matchType: "PEER", matchReason: "Direct size parity" });
      } else if (s > currentSubs * 3.0 && s <= currentSubs * 15.0) {
        targets.push({ ...c, matchType: "TARGET", matchReason: "Growth benchmark" });
      } else if (s > currentSubs * 15.0 || currentSubs < 1000) {
        leaders.push({ ...c, matchType: "LEADER", matchReason: "Niche authority" });
      } else {
        peers.push({ ...c, matchType: "Rising channel", matchReason: "Niche creator" });
      }
    });

    const finalCompetitors = [
      ...peers.sort((a, b) => parseInt(b.statistics?.subscriberCount || 0) - parseInt(a.statistics?.subscriberCount || 0)).slice(0, 3),
      ...targets.sort((a, b) => parseInt(b.statistics?.subscriberCount || 0) - parseInt(a.statistics?.subscriberCount || 0)).slice(0, 3),
      ...leaders.sort((a, b) => parseInt(b.statistics?.subscriberCount || 0) - parseInt(a.statistics?.subscriberCount || 0)).slice(0, 3)
    ];

    if (finalCompetitors.length < 6) {
      const seenIds = new Set(finalCompetitors.map(c => c.id));
      for (const c of filteredCandidates) {
        if (!seenIds.has(c.id)) {
          finalCompetitors.push({ ...c, matchType: "Rising channel", matchReason: "Niche creator" });
          seenIds.add(c.id);
          if (finalCompetitors.length >= 8) break;
        }
      }
    }

    // Fetch top video uploads for each rival channel so benchmarks, scatter charts, and titles populate
    for (const comp of finalCompetitors.slice(0, 6)) {
      try {
        const vidResult = await fetchChannelVideos(comp.id, 5);
        comp.videos = (vidResult.items || []).map(v => ({
          id: v.id,
          title: v.snippet?.title || "",
          views: parseInt(v.statistics?.viewCount || 0, 10),
          likes: parseInt(v.statistics?.likeCount || 0, 10),
          statistics: v.statistics || {},
          snippet: v.snippet || {}
        }));
      } catch (e) {
        comp.videos = [];
      }
    }

    // Save permanent competitor graph for this channel
    const discoveredIds = finalCompetitors.map(c => c.id);
    if (discoveredIds.length > 0) {
      await saveCompetitorGraph(channelId, discoveredIds, niche, searchQueries.join(", "));
      await saveCompetitors(channelId, finalCompetitors).catch(() => {});
      console.log(`[Competitor Engine] Saved permanent competitor graph for ${channelId} (${discoveredIds.length} rival channels).`);
    }

    return finalCompetitors;
  } catch (err) {
    console.error("[Competitor Engine] Discovery error:", err);
    return [];
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const force = searchParams.get("force") === "true";

    if (!channelId) {
      return apiError(new Error("Query parameter 'channelId' is required"), 400);
    }

    if (await getIsDemoMode()) {
      const allMock = Object.values(MOCK_CHANNELS).filter(c => c.id !== channelId);
      return apiSuccess({
        competitors: allMock.map(c => ({ ...c, matchType: "Demo rival" })),
        source: "demo"
      });
    }

    const pipelineData = await channelSearchPipeline(channelId);
    if (!pipelineData || !pipelineData.channel) {
      return apiError(new Error("Base channel not found"), 404);
    }

    const competitors = await getMinimalQuotaCompetitors(
      pipelineData.channel,
      pipelineData.videos || [],
      force
    );

    return apiSuccess({
      baseChannel: {
        ...pipelineData.channel,
        videos: pipelineData.videos || []
      },
      competitors,
      count: competitors.length,
      source: force ? "fresh_discovery" : "graph_cache"
    });
  } catch (error) {
    console.error("[Competitor Discover API] Error:", error);
    return apiError(error);
  }
}
