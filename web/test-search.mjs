import "dotenv/config";
import { createEmbedding } from "./src/lib/vectors/embeddings.js";

const CLUSTER_URL = process.env.ZILLIZ_CLUSTER_URL;
const TOKEN = process.env.ZILLIZ_TOKEN;
const COLLECTION_NAME = "youtube_videos";

async function testSearch() {
  console.log("Generating embedding for 'test'...");
  const vector = await createEmbedding("test");
  if (!vector) return;

  console.log(`Searching Zilliz (Vector length: ${vector.length})...`);
  
  // Try format 1: "vector" field
  const res1 = await fetch(`${CLUSTER_URL}/v2/vectordb/entities/search`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      collectionName: COLLECTION_NAME,
      vector: vector,
      limit: 5,
      outputFields: ["title"]
    })
  });
  console.log("Search Result (Format 'vector'):", await res1.text());

  // Try format 2: "data" field (array of vectors)
  const res2 = await fetch(`${CLUSTER_URL}/v2/vectordb/entities/search`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      collectionName: COLLECTION_NAME,
      data: [vector],
      limit: 5,
      outputFields: ["title"]
    })
  });
  console.log("Search Result (Format 'data'):", await res2.text());
}

testSearch();
