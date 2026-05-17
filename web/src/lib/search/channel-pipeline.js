/**
 * Channel Search Pipeline
 */

import { getChannel, saveChannel, getChannelVideos } from "../cache/turso";
import { fetchYouTubeChannels, fetchChannelVideos } from "../youtube/channels";

export async function channelSearchPipeline(query, pageToken = null) {
  if (!query) return null;

  /* 1. DATABASE CHECK (Skip if pageToken is present to force fresh YouTube results) */
  if (!pageToken || pageToken === "TURSO_PAGINATION_START") {
    const localChannel = await getChannel(query);
    if (localChannel && !pageToken) {
      const now = Math.floor(Date.now() / 1000);
      const oneDay = 24 * 60 * 60;
      const isFresh = localChannel.last_updated && (now - localChannel.last_updated < oneDay);

      if (isFresh) {
        console.log("[Channel Pipeline] Found in Turso and fresh:", localChannel.id);
        const localVideos = await getChannelVideos(localChannel.id);
        const totalExpected = parseInt(localChannel.statistics.videoCount || 0);
        
        return {
          channel: localChannel,
          videos: localVideos.slice(0, 50),
          source: "turso",
          nextPageToken: localVideos.length < totalExpected ? "TURSO_PAGINATION_START" : null
        };
      } else {
        console.log("[Channel Pipeline] Local found but STALE or no timestamp:", localChannel.id);
      }
    }
  }

  /* 2. YOUTUBE FALLBACK */
  const actualToken = pageToken === "TURSO_PAGINATION_START" ? null : pageToken;
  console.log(`[Channel Pipeline] Fetching from YouTube ${actualToken ? '(Page: ' + actualToken + ')' : ''}...`);
  
  let youtubeChannel;
  if (pageToken) {
    // If we have a pageToken, the query is likely the channelId
    const channels = await fetchYouTubeChannels(query);
    youtubeChannel = channels && channels.length > 0 ? channels[0] : null;
  } else {
    const channels = await fetchYouTubeChannels(query);
    youtubeChannel = channels && channels.length > 0 ? channels[0] : null;
  }
  
  if (!youtubeChannel) {
    console.log("[Channel Pipeline] Channel not found on YouTube");
    return null;
  }

  // Fetch videos for this channel
  let { items: youtubeVideos, nextPageToken } = await fetchChannelVideos(youtubeChannel.id, 50, actualToken);

  // If we're transitioning from Turso, we might have duplicates with page 1
  // Let's fetch page 2 immediately to ensure the user gets "more" videos
  if (pageToken === "TURSO_PAGINATION_START" && nextPageToken) {
    const page2 = await fetchChannelVideos(youtubeChannel.id, 50, nextPageToken);
    youtubeVideos = [...youtubeVideos, ...page2.items];
    nextPageToken = page2.nextPageToken;
  }

  // Background save to Turso (Only if it's the first page)
  if (!pageToken) {
    saveChannel(youtubeChannel, youtubeVideos).catch(err => {
      console.error("[Channel Pipeline] Error saving to Turso:", err);
    });
  }

  return {
    channel: {
      id: youtubeChannel.id,
      custom_url: youtubeChannel?.snippet?.customUrl || "",
      title: youtubeChannel?.snippet?.title || "Unknown",
      thumbnail: youtubeChannel?.snippet?.thumbnails?.high?.url || youtubeChannel?.snippet?.thumbnails?.default?.url || null,
      statistics: youtubeChannel.statistics || {},
    },
    videos: youtubeVideos.map(v => ({
      id: v.id,
      channel_id: youtubeChannel.id,
      title: v?.snippet?.title || "Untitled",
      thumbnail: v?.snippet?.thumbnails?.high?.url || v?.snippet?.thumbnails?.default?.url || null,
      statistics: v.statistics || {},
      published_at: v?.snippet?.publishedAt,
      snippet: v.snippet
    })),
    source: "youtube",
    nextPageToken
  };
}
