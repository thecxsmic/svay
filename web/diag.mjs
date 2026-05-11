import "dotenv/config";

const CLUSTER_URL = process.env.ZILLIZ_CLUSTER_URL;
const TOKEN = process.env.ZILLIZ_TOKEN;
const COLLECTION_NAME = "youtube_videos";

async function check() {
  console.log("Querying for data...");
  const res = await fetch(`${CLUSTER_URL}/v2/vectordb/entities/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      collectionName: COLLECTION_NAME,
      filter: 'videoId != ""',
      limit: 10
    })
  });
  console.log("Query Response:", await res.text());
}

check();
