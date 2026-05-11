import "dotenv/config";
import { runIndexingJob } from "../src/lib/jobs/index-queue.js";

async function run() {
  try {
    const result = await runIndexingJob();
    console.log("[Worker] Result:", result);
  } catch (err) {
    console.error("[Worker] Fatal:", err);
    process.exit(1);
  }
}

run();
