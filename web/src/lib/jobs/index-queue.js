import { getPendingBatch, markAsIndexed } from "../cache/turso.js";
import { createEmbedding } from "../vectors/embeddings.js";
import { insertVectors } from "../vectors/zilliz.js";

const BATCH_SIZE = 10;

export async function runIndexingJob() {
  console.log(`[Worker] Checking queue for pending videos (Batch Size: ${BATCH_SIZE})...`);

  try {
    const pendingVideos = await getPendingBatch(BATCH_SIZE);
    
    if (pendingVideos.length === 0) {
      return { status: "empty", message: "Queue is empty" };
    }

    console.log(`[Worker] Processing ${pendingVideos.length} videos...`);
    
    const validEmbeddings = [];
    const validData = [];
    const processedIds = [];

    for (const item of pendingVideos) {
      try {
        const text = `${item.snippet.title} ${item.snippet.description}`;
        const embedding = await createEmbedding(text);
        if (embedding) {
          validEmbeddings.push(embedding);
          validData.push(item);
        }
        processedIds.push(item.id.videoId);
      } catch (err) {
        console.warn(`[Worker] Failed to process ${item.id.videoId}: ${err.message}`);
        processedIds.push(item.id.videoId); 
      }
    }

    if (validEmbeddings.length > 0) {
      const res = await insertVectors(validEmbeddings, validData);
      if (res && res.code !== 0) {
        throw new Error(`Zilliz insertion failed: ${res.message}`);
      }
    }

    if (processedIds.length > 0) {
      await markAsIndexed(processedIds);
    }

    return { 
      status: "success", 
      processed: processedIds.length,
      indexed: validEmbeddings.length
    };

  } catch (error) {
    console.error("[Worker] Job Error:", error);
    throw error;
  }
}
