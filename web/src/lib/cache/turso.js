/**
 * Turso Database (LibSQL) Caching Service
 */

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

/**
 * Initialize the cache table if it doesn't exist
 */
export async function initCacheTable() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS search_cache (
        key TEXT PRIMARY KEY,
        data TEXT,
        expires_at INTEGER
      )
    `);
    console.log("[Turso] Cache table initialized");
  } catch (error) {
    console.error("[Turso] Initialization Error:", error);
  }
}

/**
 * Get data from cache
 */
export async function getCache(key) {
  if (!process.env.TURSO_DATABASE_URL) return null;

  try {
    const rs = await client.execute({
      sql: "SELECT data, expires_at FROM search_cache WHERE key = ?",
      args: [key],
    });

    if (rs.rows.length === 0) return null;

    const row = rs.rows[0];
    const now = Math.floor(Date.now() / 1000);

    if (row.expires_at < now) {
      console.log("[Cache] Key expired:", key);
      // Background delete expired
      client.execute({
        sql: "DELETE FROM search_cache WHERE key = ?",
        args: [key],
      });
      return null;
    }

    return JSON.parse(row.data);
  } catch (error) {
    console.warn("[Cache] Read Error (likely no table):", error.message);
    return null;
  }
}

/**
 * Save data to cache
 */
export async function setCache(key, data, ttlSeconds = 3600) {
  if (!process.env.TURSO_DATABASE_URL) return;

  try {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    await client.execute({
      sql: "INSERT OR REPLACE INTO search_cache (key, data, expires_at) VALUES (?, ?, ?)",
      args: [key, JSON.stringify(data), expiresAt],
    });
    console.log("[Cache] Saved key:", key);
  } catch (error) {
    console.error("[Cache] Write Error:", error);
  }
}

/**
 * Add videos to the pending indexing queue
 */
export async function queuePendingIndexing(videos) {
  if (!process.env.TURSO_DATABASE_URL || !videos || videos.length === 0) return;

  try {
    const now = Date.now();
    const batch = videos.map(video => ({
      sql: "INSERT OR IGNORE INTO pending_indexing (video_id, data, status, created_at) VALUES (?, ?, ?, ?)",
      args: [
        video.id.videoId, 
        JSON.stringify(video), 
        'pending', 
        now
      ],
    }));

    await client.batch(batch);
    console.log(`[Turso] Queued ${videos.length} videos for indexing`);
  } catch (error) {
    console.error("[Turso] Queue Error:", error);
  }
}

/**
 * Get a batch of pending videos to index
 */
export async function getPendingBatch(limit = 10) {
  if (!process.env.TURSO_DATABASE_URL) return [];

  try {
    const rs = await client.execute({
      sql: "SELECT video_id, data FROM pending_indexing WHERE status = 'pending' ORDER BY created_at ASC LIMIT ?",
      args: [limit],
    });

    return rs.rows.map(row => JSON.parse(row.data));
  } catch (error) {
    console.error("[Turso] Get Batch Error:", error);
    return [];
  }
}

/**
 * Mark videos as completed in the queue
 */
export async function markAsIndexed(videoIds) {
  if (!process.env.TURSO_DATABASE_URL || !videoIds || videoIds.length === 0) return;

  try {
    const batch = videoIds.map(id => ({
      sql: "DELETE FROM pending_indexing WHERE video_id = ?",
      args: [id],
    }));

    await client.batch(batch);
    console.log(`[Turso] Marked ${videoIds.length} videos as indexed`);
  } catch (error) {
    console.error("[Turso] Mark Complete Error:", error);
  }
}
