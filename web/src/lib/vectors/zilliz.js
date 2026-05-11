/**
 * Zilliz Cloud Vector Database Service (REST API)
 */

const CLUSTER_URL = process.env.ZILLIZ_CLUSTER_URL;
const TOKEN = process.env.ZILLIZ_TOKEN;
const COLLECTION_NAME = "youtube_videos";

/**
 * Ensure collection is loaded (required for search/query)
 */
async function loadCollection() {
  try {
    const response = await fetch(`${CLUSTER_URL}/v2/vectordb/collections/load`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ collectionName: COLLECTION_NAME }),
    });
    return await response.json();
  } catch (error) {
    console.error("[Zilliz] Load Error:", error);
  }
}

/**
 * Insert videos into Zilliz
 */
export async function insertVectors(vectors, metadata) {
  if (!CLUSTER_URL || !TOKEN) return;

  try {
    // Ensure loaded so we can check for duplicates
    await loadCollection();

    // 1. Check for existing videoIds to prevent duplicates
    const videoIds = metadata.map(item => item.id.videoId);
    const queryResponse = await fetch(`${CLUSTER_URL}/v2/vectordb/entities/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        collectionName: COLLECTION_NAME,
        filter: `videoId in [${videoIds.map(id => `"${id}"`).join(", ")}]`,
        outputFields: ["videoId"]
      }),
    });

    const queryData = await queryResponse.json();
    const existingIds = new Set((queryData.data || []).map(item => item.videoId));

    if (existingIds.size > 0) {
      console.log(`[Zilliz] Found ${existingIds.size} existing videos, skipping them.`);
    }

    // 2. Filter out items that already exist
    const newVectors = [];
    const newMetadata = [];

    metadata.forEach((item, index) => {
      if (!existingIds.has(item.id.videoId)) {
        newVectors.push(vectors[index]);
        newMetadata.push(item);
      }
    });

    if (newMetadata.length === 0) {
      console.log("[Zilliz] No new videos to insert.");
      return { code: 0, message: "No new items to insert" };
    }

    // 3. Insert only new items
    const response = await fetch(`${CLUSTER_URL}/v2/vectordb/entities/insert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        collectionName: COLLECTION_NAME,
        data: newMetadata.map((item, index) => ({
          id: Date.now() + index, // Explicit ID because autoID is false
          vector: newVectors[index],
          videoId: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          thumbnail: item.snippet.thumbnails.medium.url,
          channelId: item.snippet.channelId,
          stats: JSON.stringify(item.statistics),
          tags: JSON.stringify(item.snippet.tags || [])
        })),
      }),
    });

    const data = await response.json();
    console.log("[Zilliz] Insert Response:", data);
    return data;
  } catch (error) {
    console.error("Zilliz Insert Error:", error);
  }
}

/**
 * Search Zilliz for similar videos
 */
export async function searchVectors(vector, limit = 10) {
  if (!CLUSTER_URL || !TOKEN || !vector) return [];

  try {
    // Ensure loaded for search
    await loadCollection();

    const response = await fetch(`${CLUSTER_URL}/v2/vectordb/entities/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        collectionName: COLLECTION_NAME,
        data: [vector], // Array of vectors for search
        limit: limit,
        outputFields: ["id", "videoId", "title", "description", "channelTitle", "channelId", "publishedAt", "thumbnail", "stats", "tags"]
      }),
    });

    const data = await response.json();
    if (data.code !== 0) {
      console.error("[Zilliz] Search API Error:", data.message);
      return [];
    }

    // Map Zilliz format back to YouTube-like format
    return (data.data || []).map(item => ({
      id: { videoId: item.videoId, zillizId: item.id },
      distance: item.distance, // Critical: Include distance for filtering
      snippet: {
        title: item.title,
        description: item.description,
        channelTitle: item.channelTitle,
        channelId: item.channelId,
        publishedAt: item.publishedAt,
        tags: item.tags ? JSON.parse(item.tags) : [],
        thumbnails: { medium: { url: item.thumbnail } }
      },
      statistics: item.stats ? JSON.parse(item.stats) : {}
    }));
  } catch (error) {
    console.error("Zilliz Search Error:", error);
    return [];
  }
}
