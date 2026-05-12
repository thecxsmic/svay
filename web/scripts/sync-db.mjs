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

    await client.execute(`
      CREATE TABLE IF NOT EXISTS channels (
        id TEXT PRIMARY KEY,
        custom_url TEXT,
        title TEXT,
        thumbnail TEXT,
        statistics TEXT,
        last_updated INTEGER
      )
    `);
    console.log("✓ Table 'channels' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS videos (
        id TEXT PRIMARY KEY,
        channel_id TEXT,
        title TEXT,
        thumbnail TEXT,
        statistics TEXT,
        published_at TEXT,
        last_updated INTEGER,
        FOREIGN KEY (channel_id) REFERENCES channels (id)
      )
    `);
    console.log("✓ Table 'videos' created or already exists.");
    
    console.log("Schema sync complete!");
  } catch (error) {
    console.error("Error syncing schema:", error);
    process.exit(1);
  }
}

syncSchema();
