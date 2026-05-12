/**
 * YouTube Channel Fetching Layer
 */

/**
 * Fetch channel details by various identifiers or search query
 */
export async function fetchYouTubeChannels(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not configured");

  // 1. Identify query type for direct lookups
  if (query.startsWith("UC") && query.length === 24) {
    const channels = await getChannelDetails([query]);
    return channels || [];
  } else if (query.startsWith("@")) {
    let url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "snippet,statistics,contentDetails");
    url.searchParams.set("forHandle", query);
    url.searchParams.set("key", apiKey);
    const response = await fetch(url.toString());
    const data = await response.json();
    if (data.items?.length > 0) return data.items;
    // Fallback to search if handle lookup fails
    return await searchChannels(query);
  } else if (query.includes("youtube.com/")) {
    if (query.includes("/channel/")) {
      const id = query.split("/channel/")[1].split("/")[0].split("?")[0];
      return await getChannelDetails([id]);
    } else if (query.includes("/@")) {
      const handle = "@" + query.split("/@")[1].split("/")[0].split("?")[0];
      return await fetchYouTubeChannels(handle);
    }
  }

  // Default to broad search
  return await searchChannels(query);
}

/**
 * Get full channel details for a list of IDs
 */
async function getChannelDetails(ids) {
  if (!ids || !ids.length) return [];
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics,contentDetails");
  url.searchParams.set("id", ids.filter(Boolean).join(","));
  url.searchParams.set("key", apiKey);
  const res = await fetch(url.toString());
  const data = await res.json();
  return data.items || [];
}

/**
 * Search for multiple channels
 */
async function searchChannels(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok || !data.items || data.items.length === 0) {
    return [];
  }

  const channelIds = data.items.map(item => item.id.channelId);
  return await getChannelDetails(channelIds);
}

/**
 * Fetch recent videos for a channel (max 50)
 */
export async function fetchChannelVideos(channelId, maxResults = 50, pageToken = null) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  // 1. Search for videos from this channel
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", String(maxResults));
  if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);
  searchUrl.searchParams.set("key", apiKey);

  const searchRes = await fetch(searchUrl.toString());
  const searchData = await searchRes.json();

  if (!searchRes.ok || !searchData.items) {
    return { items: [], nextPageToken: null };
  }

  const videoIds = searchData.items.map(item => item.id.videoId);
  const nextPageToken = searchData.nextPageToken || null;
  
  // 2. Fetch detailed stats for these videos
  if (videoIds.length === 0) return { items: [], nextPageToken };

  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  statsUrl.searchParams.set("id", videoIds.join(","));
  statsUrl.searchParams.set("key", apiKey);

  const statsRes = await fetch(statsUrl.toString());
  const statsData = await statsRes.json();

  return { 
    items: statsData.items || [], 
    nextPageToken 
  };
}
