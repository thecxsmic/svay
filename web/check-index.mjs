import "dotenv/config";

const CLUSTER_URL = process.env.ZILLIZ_CLUSTER_URL;
const TOKEN = process.env.ZILLIZ_TOKEN;
const COLLECTION_NAME = "youtube_videos";

async function checkIndex() {
  const url = `${CLUSTER_URL}/v2/vectordb/indexes/describe`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ collectionName: COLLECTION_NAME, indexName: "vector" })
  });
  console.log("Index Info:", await res.text());
}

checkIndex();
