import "dotenv/config";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

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

    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        user_id TEXT PRIMARY KEY,
        subscription_id TEXT,
        plan_id TEXT,
        status TEXT,
        current_period_end INTEGER,
        updated_at INTEGER
      )
    `);
    console.log("✓ Table 'user_subscriptions' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_pins (
        user_id TEXT,
        channel_id TEXT,
        created_at INTEGER,
        PRIMARY KEY (user_id, channel_id),
        FOREIGN KEY (channel_id) REFERENCES channels (id)
      )
    `);
    console.log("✓ Table 'user_pins' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_channels (
        user_id TEXT PRIMARY KEY,
        channel_id TEXT,
        created_at INTEGER,
        FOREIGN KEY (channel_id) REFERENCES channels (id)
      )
    `);
    console.log("✓ Table 'user_channels' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS saved_analyses (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        subject_id TEXT,
        competitor_ids TEXT,
        title TEXT,
        created_at INTEGER,
        FOREIGN KEY (subject_id) REFERENCES channels (id)
      )
    `);
    console.log("✓ Table 'saved_analyses' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trend_radar (
        channel_id TEXT PRIMARY KEY,
        data TEXT,
        last_updated INTEGER,
        FOREIGN KEY (channel_id) REFERENCES channels (id)
      )
    `);
    console.log("✓ Table 'trend_radar' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS library_items (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        type TEXT,
        reference_id TEXT,
        title TEXT,
        content TEXT,
        metadata TEXT,
        created_at INTEGER,
        updated_at INTEGER
      )
    `);
    console.log("✓ Table 'library_items' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS channel_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT,
        user_id TEXT,
        subscribers INTEGER,
        views INTEGER,
        videos INTEGER,
        date TEXT,
        timestamp INTEGER,
        UNIQUE(channel_id, date),
        FOREIGN KEY (channel_id) REFERENCES channels (id)
      )
    `);
    console.log("✓ Table 'channel_snapshots' created or already exists.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        type TEXT,
        reference_id TEXT,
        timestamp INTEGER
      )
    `);
    console.log("✓ Table 'email_logs' created or already exists.");

    console.log("Schema sync complete!");  } catch (error) {
    console.error("Error syncing schema:", error);
    process.exit(1);
  }
}

syncSchema();
