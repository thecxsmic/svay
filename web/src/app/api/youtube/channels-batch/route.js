import { apiSuccess, apiError } from "@/lib/utils/response";
import { getIsDemoMode, MOCK_CHANNELS } from "@/lib/utils/demoMock";
import { getYouTubeApiKey } from "@/lib/youtube/apiKeyManager";

/**
 * Batch fetch multiple channels by IDs in a single API call
 * Supports up to 50 channel IDs per request (YouTube API limit)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    
    if (!idsParam) {
      return apiError(new Error("Query parameter 'ids' is required (comma-separated channel IDs)"), 400);
    }

    const ids = idsParam.split(",").map(id => id.trim()).filter(Boolean);
    
    if (ids.length === 0) {
      return apiError(new Error("At least one channel ID is required"), 400);
    }

    if (ids.length > 50) {
      return apiError(new Error("Maximum 50 channel IDs per request"), 400);
    }

    // Demo mode
    if (await getIsDemoMode()) {
      const mockResults = ids
        .map(id => MOCK_CHANNELS[id])
        .filter(Boolean);
      return apiSuccess({ 
        channels: mockResults,
        source: "demo"
      });
    }

    console.log(`[Channels Batch API] Fetching ${ids.length} channels in batch`);

    // Single YouTube API call for all channels
    const apiKey = await getYouTubeApiKey("channels.list");
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "snippet,statistics,contentDetails");
    url.searchParams.set("id", ids.join(","));
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      const error = new Error(data.error?.message || "YouTube API Error");
      error.status = res.status;
      error.details = data.error;
      throw error;
    }

    // Format response to match single channel endpoint structure
    const channels = (data.items || []).map(item => ({
      id: item.id,
      title: item?.snippet?.title || "Unknown Channel",
      custom_url: item?.snippet?.customUrl || "",
      thumbnail: item?.snippet?.thumbnails?.high?.url || 
                 item?.snippet?.thumbnails?.medium?.url || 
                 item?.snippet?.thumbnails?.default?.url || null,
      statistics: item?.statistics || {},
      contentDetails: item?.contentDetails || {},
      snippet: item?.snippet || {}
    }));

    console.log(`[Channels Batch API] Successfully fetched ${channels.length}/${ids.length} channels`);

    return apiSuccess({ 
      channels,
      source: "youtube",
      requestedCount: ids.length,
      returnedCount: channels.length
    });
  } catch (error) {
    console.error("[Channels Batch API] Error:", error);
    return apiError(error);
  }
}
