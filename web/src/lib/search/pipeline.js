/**
 * Core Search Pipeline
 */

import { fetchYouTubeVideos, fetchVideoStats } from "../youtube/search";
import { createEmbedding } from "../vectors/embeddings";
import { searchVectors, insertVectors } from "../vectors/zilliz";
import { getCache, setCache, queuePendingIndexing } from "../cache/turso";
import { calculateViralityScore } from "../ranking/virality";

const MIN_SIMILARITY_THRESHOLD = 0.77; // Only show results with >= 0.77 similarity

function rerankResults(results, filters) {
  if (!results || results.length === 0) return [];

  const isViralitySort = filters.order === "virality";

  // 1. Sort by a mix of distance (similarity) and recency
  // distance is cosine similarity (higher is better in our mapping)
  return results
    .map(item => {
      const daysOld = (Date.now() - new Date(item.snippet.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
      const freshnessScore = Math.max(0, 1 - (daysOld / 356)); // 1.0 for new, 0 for 1yr+
      
      if (isViralitySort) {
        const v = calculateViralityScore(item);
        // Virality weight: 80% virality, 20% similarity
        item.score = (v.score / 100 * 0.8) + (item.distance * 0.2);
      } else {
        // Weighted score: 70% similarity, 20% freshness, 10% randomness
        item.score = (item.distance * 0.7) + (freshnessScore * 0.2) + (Math.random() * 0.1);
      }
      return item;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, filters.maxResults || 10);
}

// Real Background Jobs
async function queueBackgroundSave(key, data, query) {
  // Index all videos from the result set to ensure a comprehensive database
  if (!data || data.length === 0) {
    console.log("[Jobs] No items to index, skipping");
    return;
  }

  console.log(`[Jobs] Starting background save for ${data.length} items...`);
  
  // 1. Save to Turso Cache (Always save all results to cache)
  try {
    await setCache(key, data);
    console.log("[Jobs] Successfully updated Turso cache");
  } catch (err) {
    console.error("[Jobs] Cache Save Error:", err.message);
  }

  // 2. Queue for background indexing
  try {
    await queuePendingIndexing(data); // Queue all items
    console.log(`[Jobs] Successfully queued ${data.length} items for background indexing`);
  } catch (error) {
    console.error("[Jobs] Queue Pipeline Error:", error);
  }
}

export async function searchPipeline(filters) {
  const cacheKey = `search:${JSON.stringify(filters)}`;

  /* 1. CACHE CHECK */
  if (!filters.disableCache) {
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log("[Pipeline] Returning cached results");
      // Ensure all cached items have a distance for the UI
      return cached.map(item => ({
        ...item,
        distance: item.distance ?? 0.95
      }));
    }
  }

  /* 2. VECTOR SEARCH (Semantic) */
  let vectorResults = [];
  try {
    const embedding = await createEmbedding(filters.query);
    if (embedding) {
      // Fetch more candidates to see what's in the DB for debugging
      const rawResults = await searchVectors(embedding, 20);
      
      if (rawResults.length > 0) {
        console.log("--- Raw Vector Matches ---");
        rawResults.forEach((item, i) => {
          console.log(`${i + 1}. [Sim: ${item.distance.toFixed(4)}] ${item.snippet.title.substring(0, 50)}...`);
        });
        console.log("-------------------------");
      }

      // Filter by similarity threshold for the actual results
      vectorResults = rawResults.filter(item => item.distance >= MIN_SIMILARITY_THRESHOLD);
    }
  } catch (e) {
    console.warn("[Pipeline] Vector search failed, falling back...");
  }
  
  const reranked = rerankResults(vectorResults, filters);

  // Check if keywords from query are present in the results
  const keywords = filters.query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
  const hasKeywordMatch = reranked.length > 0 && reranked.some(item => 
    keywords.some(k => item.snippet.title.toLowerCase().includes(k))
  );

  // If vectorOnly is true, return what we have UNLESS there are no results or no keyword matches
  // in which case we might still want to show something relevant from YouTube
  if (filters.vectorOnly && reranked.length > 0 && hasKeywordMatch) {
    console.log(`[Pipeline] Vector-only: Found ${reranked.length} quality matches.`);
    return reranked;
  }

  /* 3. FALLBACK TO YOUTUBE (Fresh Data) */
  if (reranked.length < 10 || !hasKeywordMatch) {
    console.log(`[Pipeline] ${!hasKeywordMatch ? 'No keyword matches' : 'Too few results'}. Fetching fresh from YouTube...`);
    const fresh = await fetchYouTubeVideos({ ...filters, maxResults: 50 });
    
    const videoIds = fresh.map(v => v.id.videoId);
    const enriched = await fetchVideoStats(videoIds);
    
    const normalizedResults = enriched.map(item => ({
      ...item,
      distance: 0.95, // Default similarity for direct YouTube search (high relevance)
      id: typeof item.id === 'string' ? { videoId: item.id } : item.id
    }));

    queueBackgroundSave(cacheKey, normalizedResults);

    // If virality sort is requested, sort the fresh results before returning
    if (filters.order === "virality") {
      return normalizedResults
        .map(item => ({
          ...item,
          vScore: calculateViralityScore(item).score
        }))
        .sort((a, b) => b.vScore - a.vScore)
        .map(({ vScore, ...item }) => item);
    }

    // If we have some vector results, merge them with fresh ones to provide variety
    // but prioritize the fresh data as it's guaranteed to be relevant to the query
    return normalizedResults;
  }

  return reranked;
}
