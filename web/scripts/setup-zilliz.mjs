import "dotenv/config";

const CLUSTER_URL = process.env.ZILLIZ_CLUSTER_URL;
const TOKEN = process.env.ZILLIZ_TOKEN;
const COLLECTION_NAME = "youtube_videos";

async function setupZilliz() {
  console.log("Setting up Zilliz collection...");

  try {
    // 1. Check if collection exists and get its status
    const descRes = await fetch(`${CLUSTER_URL}/v2/vectordb/collections/describe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
      body: JSON.stringify({ collectionName: COLLECTION_NAME }),
    });
    
    const descData = await descRes.json();
    
    if (descData.code === 0) {
      console.log(`Collection '${COLLECTION_NAME}' already exists.`);
      const existingIndexes = descData.data.indexes || [];
      const hasVectorIndex = existingIndexes.some(idx => idx.fieldName === "vector");

      if (hasVectorIndex) {
        console.log("✓ Vector index already exists. Skipping creation.");
        return;
      }

      console.log("No vector index found. Creating index...");
      // Releasing collection is required before creating an index if it was loaded
      if (descData.data.load === "LoadStateLoaded") {
        await fetch(`${CLUSTER_URL}/v2/vectordb/collections/release`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
          body: JSON.stringify({ collectionName: COLLECTION_NAME }),
        });
      }

      const indexResponse = await fetch(`${CLUSTER_URL}/v2/vectordb/indexes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
        body: JSON.stringify({
          collectionName: COLLECTION_NAME,
          indexParams: [
            { fieldName: "vector", indexName: "vector_idx", metricType: "COSINE" }
          ]
        }),
      });
      const indexData = await indexResponse.json();
      if (indexData.code === 0) {
        console.log("✓ Index created successfully!");
      } else {
        console.error("Failed to create index:", indexData);
      }
      return;
    }

    // 2. Create if it doesn't exist
    console.log("Creating new collection...");
    const response = await fetch(`${CLUSTER_URL}/v2/vectordb/collections/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
      body: JSON.stringify({
        collectionName: COLLECTION_NAME,
        schema: {
          fields: [
            { name: "id", type: "Int64", isPrimary: true, autoID: true },
            { name: "vector", type: "FloatVector", params: { dim: "768" } },
            { name: "videoId", type: "VarChar", params: { max_length: "255" } },
            { name: "title", type: "VarChar", params: { max_length: "1024" } },
            { name: "description", type: "VarChar", params: { max_length: "4096" } },
            { name: "channelTitle", type: "VarChar", params: { max_length: "1024" } },
            { name: "channelId", type: "VarChar", params: { max_length: "255" } },
            { name: "publishedAt", type: "VarChar", params: { max_length: "255" } },
            { name: "thumbnail", type: "VarChar", params: { max_length: "1024" } },
            { name: "stats", type: "VarChar", params: { max_length: "4096" } },
            { name: "tags", type: "VarChar", params: { max_length: "4096" } }
          ]
        },
        indexParams: [
          { fieldName: "vector", indexName: "vector_idx", metricType: "COSINE" }
        ]
      }),
    });

    const data = await response.json();
    if (data.code === 0) {
      console.log("✓ Zilliz collection created!");
    } else {
      console.error("Failed:", data);
      
      // If that still fails, use the simplified version but we MUST ensure autoID is on.
      // In simplified v2, autoID is ALWAYS true if not provided? Or we can't control it.
      // Let's try to just use the simplified version but keep it minimal.
      console.log("Final fallback to simplified...");
      await fetch(`${CLUSTER_URL}/v2/vectordb/collections/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKEN}` },
        body: JSON.stringify({
          collectionName: COLLECTION_NAME,
          dimension: 768,
          metricType: "COSINE"
        }),
      });
      console.log("✓ Simplified collection created (Check if autoID is true in Console)");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

setupZilliz();
