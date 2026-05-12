import { channelSearchPipeline } from "@/lib/search/channel-pipeline";
import { fetchYouTubeChannels } from "@/lib/youtube/channels";
import { searchChannelsLocal } from "@/lib/cache/turso";
import { apiSuccess, apiError } from "@/lib/utils/response";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const channelId = searchParams.get("channelId");
    const pageToken = searchParams.get("pageToken");
    
    // 1. If channelId is provided, do a deep analysis (Pipeline)
    if (channelId) {
      const results = await channelSearchPipeline(channelId, pageToken);
      if (!results) return apiError(new Error("Channel not found"), 404);
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
          thumbnail: c?.snippet?.thumbnails?.high?.url || c?.snippet?.thumbnails?.default?.url || null,
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
