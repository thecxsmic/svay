import "dotenv/config";
import { insertVectors } from "./src/lib/vectors/zilliz.js";

async function manualInsert() {
  console.log("Starting manual insert test...");
  
  const dummyVector = new Array(768).fill(0).map(() => Math.random());
  const dummyMetadata = [{
    id: { videoId: "manual_test_id" },
    snippet: {
      title: "Manual Test Title",
      description: "Manual Test Description",
      channelTitle: "Test Channel",
      publishedAt: new Date().toISOString(),
      thumbnails: { medium: { url: "https://example.com/thumb.jpg" } }
    },
    statistics: { viewCount: "100" }
  }];

  try {
    const res = await insertVectors([dummyVector], dummyMetadata);
    console.log("Manual Insert Final Result:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Manual Insert Failed:", err);
  }
}

manualInsert();
