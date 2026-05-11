import "dotenv/config";

const CLUSTER_URL = process.env.ZILLIZ_CLUSTER_URL;
const TOKEN = process.env.ZILLIZ_TOKEN;
const COLLECTION_NAME = "youtube_videos";

async function checkZillizStatus() {
  console.log(`Checking status for collection: ${COLLECTION_NAME}`);

  try {
    // 1. Describe Collection
    // 1. Describe Collection
    const descRes = await fetch(`${CLUSTER_URL}/v2/vectordb/collections/describe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ collectionName: COLLECTION_NAME })
    });
    const descData = await descRes.json();
    console.log("Collection Description:", JSON.stringify(descData, null, 2));

    // 2. Describe Index (only if index exists)
    if (descData.data && descData.data.indexes && descData.data.indexes.length > 0) {
      for (const index of descData.data.indexes) {
        const indexRes = await fetch(`${CLUSTER_URL}/v2/vectordb/indexes/describe`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${TOKEN}`,
          },
          body: JSON.stringify({ 
            collectionName: COLLECTION_NAME,
            indexName: index.indexName
          })
        });
        const indexData = await indexRes.json();
        console.log(`Index Description (${index.indexName}):`, JSON.stringify(indexData, null, 2));
      }
    } else {
      console.log("No indexes found to describe.");
    }

    // 3. Check Row Count
    const statsRes = await fetch(`${CLUSTER_URL}/v2/vectordb/collections/get_stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ collectionName: COLLECTION_NAME })
    });
    const statsData = await statsRes.json();
    console.log("Collection Stats:", JSON.stringify(statsData, null, 2));

  } catch (error) {
    console.error("Error checking Zilliz status:", error);
  }
}

checkZillizStatus();
