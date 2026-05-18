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

/**
 * Search channels in local database
 */
export async function searchChannelsLocal(query) {
  if (!process.env.TURSO_DATABASE_URL) return [];

  try {
    const rs = await client.execute({
      sql: `SELECT * FROM channels 
            WHERE title LIKE ? 
            OR custom_url LIKE ? 
            OR id = ?
            LIMIT 10`,
      args: [`%${query}%`, `%${query}%`, query],
    });

    return rs.rows.map(row => ({
      ...row,
      statistics: JSON.parse(row.statistics),
    }));
  } catch (error) {
    console.error("[Turso] Search Local Channels Error:", error);
    return [];
  }
}

/**
 * Get channel from database
 */
export async function getChannel(query) {
  if (!process.env.TURSO_DATABASE_URL) return null;

  try {
    // Try by ID, Custom URL (handle), or exact Title match
    const rs = await client.execute({
      sql: `SELECT * FROM channels 
            WHERE id = ? 
            OR custom_url = ? 
            OR custom_url = ?
            OR title COLLATE NOCASE = ?
            LIMIT 1`,
      args: [query, query, query.startsWith('@') ? query : `@${query}`, query],
    });

    if (rs.rows.length === 0) return null;
    
    const channel = rs.rows[0];
    return {
      ...channel,
      statistics: JSON.parse(channel.statistics),
    };
  } catch (error) {
    console.error("[Turso] Get Channel Error:", error);
    return null;
  }
}

/**
 * Save channel and its videos to database
 */
export async function saveChannel(channel, videos = []) {
  if (!process.env.TURSO_DATABASE_URL) return;

  try {
    const now = Math.floor(Date.now() / 1000);
    
    // 1. Save Channel
    await client.execute({
      sql: `INSERT OR REPLACE INTO channels (id, custom_url, title, thumbnail, statistics, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        channel.id,
        channel?.snippet?.customUrl || channel.custom_url || "",
        channel?.snippet?.title || channel.title || "Unknown",
        channel?.snippet?.thumbnails?.high?.url || channel?.snippet?.thumbnails?.default?.url || channel.thumbnail || null,
        JSON.stringify(channel.statistics || {}),
        now
      ],
    });

    // 2. Save Videos (if any)
    if (videos.length > 0) {
      const videoBatch = videos.map(v => ({
        sql: `INSERT OR REPLACE INTO videos (id, channel_id, title, thumbnail, statistics, published_at, last_updated)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          v.id,
          channel.id,
          v.snippet.title,
          v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url,
          JSON.stringify(v.statistics),
          v.snippet.publishedAt,
          now
        ]
      }));

      await client.batch(videoBatch);
      console.log(`[Turso] Saved channel ${channel.id} and ${videos.length} videos`);
    } else {
      console.log(`[Turso] Saved channel ${channel.id}`);
    }
  } catch (error) {
    console.error("[Turso] Save Channel Error:", error);
  }
}

/**
 * Get videos for a channel from database
 */
export async function getChannelVideos(channelId) {
  if (!process.env.TURSO_DATABASE_URL) return [];

  try {
    const rs = await client.execute({
      sql: "SELECT * FROM videos WHERE channel_id = ? ORDER BY published_at DESC",
      args: [channelId],
    });

    return rs.rows.map(row => ({
      ...row,
      statistics: JSON.parse(row.statistics),
      snippet: {
        title: row.title,
        description: "", // Description not saved as per user request
        thumbnails: { 
          default: { url: row.thumbnail },
          medium: { url: row.thumbnail },
          high: { url: row.thumbnail } 
        },
        publishedAt: row.published_at,
        channelId: row.channel_id,
        channelTitle: row.channel_title || "" // Might want to add channel_title to videos table later
      }
    }));
  } catch (error) {
    console.error("[Turso] Get Channel Videos Error:", error);
    return [];
  }
}

/**
 * Toggle a channel pin for a user
 */
export async function togglePin(userId, channelId) {
  if (!process.env.TURSO_DATABASE_URL) return { success: false };

  try {
    const rs = await client.execute({
      sql: "SELECT 1 FROM user_pins WHERE user_id = ? AND channel_id = ?",
      args: [userId, channelId],
    });

    const isPinned = rs.rows.length > 0;

    if (isPinned) {
      await client.execute({
        sql: "DELETE FROM user_pins WHERE user_id = ? AND channel_id = ?",
        args: [userId, channelId],
      });
      return { success: true, pinned: false };
    } else {
      await client.execute({
        sql: "INSERT INTO user_pins (user_id, channel_id, created_at) VALUES (?, ?, ?)",
        args: [userId, channelId, Date.now()],
      });
      return { success: true, pinned: true };
    }
  } catch (error) {
    console.error("[Turso] Toggle Pin Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all pinned channels for a user
 */
export async function getPinnedChannels(userId) {
  if (!process.env.TURSO_DATABASE_URL) return [];

  try {
    const rs = await client.execute({
      sql: `SELECT c.* FROM channels c 
            JOIN user_pins p ON c.id = p.channel_id 
            WHERE p.user_id = ? 
            ORDER BY p.created_at DESC`,
      args: [userId],
    });

    return rs.rows.map(row => ({
      ...row,
      statistics: JSON.parse(row.statistics),
    }));
  } catch (error) {
    console.error("[Turso] Get Pinned Channels Error:", error);
    return [];
  }
}

/**
 * Check if a channel is pinned by a user
 */
export async function isChannelPinned(userId, channelId) {
  if (!process.env.TURSO_DATABASE_URL) return false;

  try {
    const rs = await client.execute({
      sql: "SELECT 1 FROM user_pins WHERE user_id = ? AND channel_id = ?",
      args: [userId, channelId],
    });

    return rs.rows.length > 0;
  } catch (error) {
    console.error("[Turso] Check Pin Error:", error);
    return false;
  }
}

/**
 * Set the primary user channel
 */
export async function setUserChannel(userId, channelId) {
  if (!process.env.TURSO_DATABASE_URL) return { success: false };

  try {
    await client.execute({
      sql: "INSERT OR REPLACE INTO user_channels (user_id, channel_id, created_at) VALUES (?, ?, ?)",
      args: [userId, channelId, Date.now()],
    });
    return { success: true };
  } catch (error) {
    console.error("[Turso] Set User Channel Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get the primary user channel for a user
 */
export async function getUserChannel(userId) {
  if (!process.env.TURSO_DATABASE_URL) return null;

  try {
    const rs = await client.execute({
      sql: `SELECT c.* FROM channels c 
            JOIN user_channels uc ON c.id = uc.channel_id 
            WHERE uc.user_id = ?`,
      args: [userId],
    });

    if (rs.rows.length === 0) return null;

    const row = rs.rows[0];
    return {
      ...row,
      statistics: JSON.parse(row.statistics),
    };
  } catch (error) {
    console.error("[Turso] Get User Channel Error:", error);
    return null;
  }
}

/**
 * Save a competitor analysis
 */
export async function saveAnalysis(userId, subjectId, competitorIds, title) {
  if (!process.env.TURSO_DATABASE_URL) return { success: false };

  try {
    const id = Math.random().toString(36).substring(2, 15);
    await client.execute({
      sql: `INSERT INTO saved_analyses (id, user_id, subject_id, competitor_ids, title, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, userId, subjectId, JSON.stringify(competitorIds), title, Date.now()],
    });
    return { success: true, id };
  } catch (error) {
    console.error("[Turso] Save Analysis Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all saved analyses for a user
 */
export async function getSavedAnalyses(userId) {
  if (!process.env.TURSO_DATABASE_URL) return [];

  try {
    const rs = await client.execute({
      sql: `SELECT a.*, c.title as subject_title, c.thumbnail as subject_thumbnail 
            FROM saved_analyses a 
            JOIN channels c ON a.subject_id = c.id 
            WHERE a.user_id = ? 
            ORDER BY a.created_at DESC`,
      args: [userId],
    });

    return rs.rows.map(row => ({
      ...row,
      competitor_ids: JSON.parse(row.competitor_ids)
    }));
  } catch (error) {
    console.error("[Turso] Get Saved Analyses Error:", error);
    return [];
  }
}

/**
 * Delete a saved analysis
 */
export async function deleteAnalysis(userId, analysisId) {
  if (!process.env.TURSO_DATABASE_URL) return { success: false };

  try {
    await client.execute({
      sql: "DELETE FROM saved_analyses WHERE user_id = ? AND id = ?",
      args: [userId, analysisId],
    });
    return { success: true };
  } catch (error) {
    console.error("[Turso] Delete Analysis Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Save trend radar data
 */
export async function saveTrendRadar(channelId, data) {
  if (!process.env.TURSO_DATABASE_URL) return;

  try {
    const now = Math.floor(Date.now() / 1000);
    await client.execute({
      sql: "INSERT OR REPLACE INTO trend_radar (channel_id, data, last_updated) VALUES (?, ?, ?)",
      args: [channelId, JSON.stringify(data), now],
    });
    console.log(`[Turso] Saved trend radar for channel ${channelId}`);
  } catch (error) {
    console.error("[Turso] Save Trend Radar Error:", error);
  }
}

/**
 * Get trend radar data
 */
export async function getTrendRadar(channelId) {
  if (!process.env.TURSO_DATABASE_URL) return null;

  try {
    const rs = await client.execute({
      sql: "SELECT data, last_updated FROM trend_radar WHERE channel_id = ?",
      args: [channelId],
    });

    if (rs.rows.length === 0) return null;

    const row = rs.rows[0];
    return {
      data: JSON.parse(row.data),
      last_updated: row.last_updated
    };
  } catch (error) {
    console.error("[Turso] Get Trend Radar Error:", error);
    return null;
  }
}

/**
 * Save an item to the Research Library
 */
export async function saveLibraryItem(userId, { id, type, reference_id, title, content, metadata }) {
  if (!process.env.TURSO_DATABASE_URL) return { success: false };

  try {
    const itemId = id || Math.random().toString(36).substring(2, 15);
    const now = Date.now();
    await client.execute({
      sql: `INSERT OR REPLACE INTO library_items (id, user_id, type, reference_id, title, content, metadata, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [itemId, userId, type, reference_id || null, title, content || "", JSON.stringify(metadata || {}), now, now],
    });
    return { success: true, id: itemId };
  } catch (error) {
    console.error("[Turso] Save Library Item Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all library items for a user
 */
export async function getLibraryItems(userId, type = null) {
  if (!process.env.TURSO_DATABASE_URL) return [];

  try {
    let sql = "SELECT * FROM library_items WHERE user_id = ? ORDER BY created_at DESC";
    let args = [userId];

    if (type) {
      sql = "SELECT * FROM library_items WHERE user_id = ? AND type = ? ORDER BY created_at DESC";
      args = [userId, type];
    }

    const rs = await client.execute({ sql, args });
    return rs.rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata)
    }));
  } catch (error) {
    console.error("[Turso] Get Library Items Error:", error);
    return [];
  }
}

/**
 * Get a specific library item by reference_id
 */
export async function getLibraryItemByReference(userId, referenceId) {
  if (!process.env.TURSO_DATABASE_URL || !referenceId) return null;

  try {
    const rs = await client.execute({
      sql: "SELECT * FROM library_items WHERE user_id = ? AND reference_id = ? LIMIT 1",
      args: [userId, referenceId],
    });

    if (rs.rows.length === 0) return null;

    const row = rs.rows[0];
    return {
      ...row,
      metadata: JSON.parse(row.metadata)
    };
  } catch (error) {
    console.error("[Turso] Get Library Item By Reference Error:", error);
    return null;
  }
}

/**
 * Delete a library item
 */
export async function deleteLibraryItem(userId, itemId) {
  if (!process.env.TURSO_DATABASE_URL) return { success: false };

  try {
    await client.execute({
      sql: "DELETE FROM library_items WHERE user_id = ? AND id = ?",
      args: [userId, itemId],
    });
    return { success: true };
  } catch (error) {
    console.error("[Turso] Delete Library Item Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a specific library item by id
 */
export async function getLibraryItemById(userId, itemId) {
  if (!process.env.TURSO_DATABASE_URL || !itemId) return null;

  try {
    const rs = await client.execute({
      sql: "SELECT * FROM library_items WHERE user_id = ? AND id = ? LIMIT 1",
      args: [userId, itemId],
    });

    if (rs.rows.length === 0) return null;

    const row = rs.rows[0];
    return {
      ...row,
      metadata: JSON.parse(row.metadata)
    };
  } catch (error) {
    console.error("[Turso] Get Library Item By Id Error:", error);
    return null;
  }
}

/**
 * Unset the primary user channel
 */
export async function unsetUserChannel(userId) {
  if (!process.env.TURSO_DATABASE_URL) return { success: false };

  try {
    await client.execute({
      sql: "DELETE FROM user_channels WHERE user_id = ?",
      args: [userId],
    });
    return { success: true };
  } catch (error) {
    console.error("[Turso] Unset User Channel Error:", error);
    return { success: false, error: error.message };
  }
}
