import { NextResponse } from "next/server";

/*
|--------------------------------------------------------------------------
| BUILD YOUTUBE SEARCH URL
|--------------------------------------------------------------------------
*/

function buildYouTubeSearchURL(filters) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");

  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", filters.query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(filters.maxResults));
  url.searchParams.set("regionCode", filters.region || "US");
  url.searchParams.set("relevanceLanguage", filters.language || "en");
  url.searchParams.set("safeSearch", filters.safeSearch || "moderate");
  url.searchParams.set("order", filters.order || "relevance");

  if (filters.categoryId) {
    url.searchParams.set("videoCategoryId", filters.categoryId);
  }

  if (filters.duration) {
    url.searchParams.set("videoDuration", filters.duration);
  }

  if (filters.hdOnly) {
    url.searchParams.set("videoDefinition", "high");
  }

  if (filters.captioned) {
    url.searchParams.set("videoCaption", "closedCaption");
  }

  if (filters.uploadDate) {
    const now = new Date();
    switch (filters.uploadDate) {
      case "hour":
        now.setHours(now.getHours() - 1);
        break;
      case "today":
        now.setDate(now.getDate() - 1);
        break;
      case "week":
        now.setDate(now.getDate() - 7);
        break;
      case "month":
        now.setMonth(now.getMonth() - 1);
        break;
      case "year":
        now.setFullYear(now.getFullYear() - 1);
        break;
    }
    url.searchParams.set("publishedAfter", now.toISOString());
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured");
  }
  url.searchParams.set("key", apiKey);

  return url;
}

/*
|--------------------------------------------------------------------------
| QUERY PARSER
|--------------------------------------------------------------------------
*/

function parseFilters(req) {
  const params = req.nextUrl.searchParams;

  return {
    query: params.get("q") || "",
    region: params.get("region") || "US",
    language: params.get("lang") || "en",
    categoryId: params.get("categoryId") || undefined,
    uploadDate: params.get("uploadDate") || undefined,
    duration: params.get("duration") || undefined,
    order: params.get("order") || "relevance",
    maxResults: Math.min(Number(params.get("maxResults") || 10), 50),
    safeSearch: params.get("safeSearch") || "moderate",
    hdOnly: params.get("hdOnly") === "true",
    captioned: params.get("captioned") === "true",
  };
}

export async function GET(req) {
  try {
    const filters = parseFilters(req);
    
    if (!filters.query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const url = buildYouTubeSearchURL(filters);
    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
