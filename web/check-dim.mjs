import "dotenv/config";
import { createEmbedding } from "./src/lib/vectors/embeddings.js";

async function checkDimension() {
  console.log("Checking Jina AI embedding dimension...");
  const embedding = await createEmbedding("test");
  if (embedding) {
    console.log(`Actual Dimension: ${embedding.length}`);
  } else {
    console.error("Failed to get embedding");
  }
}

checkDimension();
