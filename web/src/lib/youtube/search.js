/**
 * YouTube Data Fetching Layer
 */

import { buildYouTubeSearchURL } from "./filters";

export async function fetchYouTubeVideos(filters) {
  const url = buildYouTubeSearchURL(filters);
  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || "YouTube API Error");
    error.status = response.status;
    error.details = data.error;
    throw error;
  }

  return data.items || [];
}

/**
 * Fetch detailed stats for a list of video IDs
 */
export async function fetchVideoStats(videoIds) {
  if (!videoIds.length) return [];
  
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "statistics,snippet,contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();
  
  return data.items || [];
}
