import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

async function syncSchema() {
  console.log("Syncing schema to Turso...");
  
  if (!process.env.TURSO_DATABASE_URL) {
    console.error("TURSO_DATABASE_URL is not defined in .env");
    process.exit(1);
  }

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS search_cache (
        key TEXT PRIMARY KEY,
        data TEXT,
        expires_at INTEGER
      )
    `);
    console.log("✓ Table 'search_cache' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS pending_indexing (
        video_id TEXT PRIMARY KEY,
        data TEXT,
        status TEXT DEFAULT 'pending',
        created_at INTEGER
      )
    `);
    console.log("✓ Table 'pending_indexing' created or already exists.");
    
    // Check if there are other tables needed. 
    // For now, this is the only one identified in the codebase.
    
    console.log("Schema sync complete!");
  } catch (error) {
    console.error("Error syncing schema:", error);
    process.exit(1);
  }
}

syncSchema();
