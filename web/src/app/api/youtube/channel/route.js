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
      
    const results = await fetchYouTubeChannels(nicheQuery);
    const currentSubs = parseInt(channel.statistics?.subscriberCount || 0, 10);
    const filtered = (results || []).filter(c => c.id !== channel.id);
    
    const mapped = filtered.map(c => ({
      id: c.id,
      title: c?.snippet?.title || c.title || "Unknown Channel",
      custom_url: c?.snippet?.customUrl || "",
      thumbnail: c?.snippet?.thumbnails?.high?.url || c?.snippet?.thumbnails?.medium?.url || c?.snippet?.thumbnails?.default?.url || null,
      statistics: c?.statistics || {}
    }));

    const peers = mapped.filter(c => {
      const s = parseInt(c.statistics?.subscriberCount || 0, 10);
      return s >= currentSubs * 0.5 && s <= currentSubs * 2;
    }).slice(0, 3);

    const growthTargets = mapped.filter(c => {
      const s = parseInt(c.statistics?.subscriberCount || 0, 10);
      return s > currentSubs * 2 && s <= currentSubs * 10;
    }).slice(0, 3);

    const marketLeaders = mapped.filter(c => {
      const s = parseInt(c.statistics?.subscriberCount || 0, 10);
      return s > currentSubs * 10;
    }).slice(0, 3);

    const topPicks = [];
    if (peers.length > 0) topPicks.push({ ...peers[0], matchType: 'PEER', matchReason: 'Direct size parity' });
    if (growthTargets.length > 0) topPicks.push({ ...growthTargets[0], matchType: 'TARGET', matchReason: 'Growth benchmark' });
    if (marketLeaders.length > 0) topPicks.push({ ...marketLeaders[0], matchType: 'LEADER', matchReason: 'Niche authority' });

    const finalResults = topPicks.length > 0 ? [...topPicks, ...mapped.filter(c => !topPicks.find(p => p.id === c.id))] : mapped;
    return finalResults;
  } catch (err) {
    console.error("Error generating competitors on backend:", err);
    return [];
  }
}

