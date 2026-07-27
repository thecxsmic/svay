/**
 * YouTube Channel Fetching Layer
 */

import { getYouTubeApiKey, markKeyExhausted } from "@/lib/youtube/apiKeyManager";

/**
 * Wrapper: fetch with automatic quota-exhaustion fallback
 */
async function ytFetch(url, callType) {
  const apiKey = await getYouTubeApiKey(callType);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (!res.ok) {
    // If quota exceeded, mark the key and retry once with the next key
    if (res.status === 403 && data?.error?.errors?.[0]?.reason === "quotaExceeded") {
      markKeyExhausted(apiKey);
      const nextKey = await getYouTubeApiKey(callType);
      url.searchParams.set("key", nextKey);
      const retry = await fetch(url.toString());
      return { res: retry, data: await retry.json() };
    }
    return { res, data };
  }

  return { res, data };
}

/**
 * Fetch channel details by various identifiers or search query
 */
export async function fetchYouTubeChannels(query) {
  // 1. Identify query type for direct lookups
  if (query.startsWith("UC") && query.length === 24) {
    const channels = await getChannelDetails([query]);
    return channels || [];
  } else if (query.startsWith("@")) {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "snippet,statistics,contentDetails");
    url.searchParams.set("forHandle", query);

    const { res, data } = await ytFetch(url, "channels.list");
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

  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet,statistics,contentDetails");
  url.searchParams.set("id", ids.filter(Boolean).join(","));

  const { data } = await ytFetch(url, "channels.list");
  return data.items || [];
}

/**
 * Search for multiple channels
 */
async function searchChannels(query) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "25");

  const { res, data } = await ytFetch(url, "search.list");

  if (!res.ok || !data.items || data.items.length === 0) {
    return [];
  }

  const channelIds = data.items.map((item) => item.id.channelId);
  return await getChannelDetails(channelIds);
}

/**
 * Fetch recent videos for a channel (max 50)
 */
export async function fetchChannelVideos(channelId, maxResults = 50, pageToken = null) {
  // 1. Search for videos from this channel
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("maxResults", String(maxResults));
  if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

  const { res: searchRes, data: searchData } = await ytFetch(searchUrl, "search.list");

  if (!searchRes.ok || !searchData.items) {
    return { items: [], nextPageToken: null };
  }

  const videoIds   = searchData.items.map((item) => item.id.videoId);
  const nextToken  = searchData.nextPageToken || null;

  if (videoIds.length === 0) return { items: [], nextPageToken: null };

  // 2. Fetch detailed stats for these videos
  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("part", "snippet,statistics,contentDetails");
  statsUrl.searchParams.set("id", videoIds.join(","));

  const { data: statsData } = await ytFetch(statsUrl, "videos.list");

  return {
    items:         statsData.items || [],
    nextPageToken: nextToken,
  };
}
