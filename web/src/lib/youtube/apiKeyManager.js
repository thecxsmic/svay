/**
 * YouTube API Key Pool Manager
 *
 * Keys are stored in Turso (youtube_api_keys table) and loaded into memory
 * at first use. Quota usage is tracked in memory and resets daily at midnight
 * Pacific Time (YouTube's quota reset schedule).
 *
 * Quota costs (YouTube Data API v3 defaults):
 *   search.list          → 100 units
 *   videos.list          →   1 unit
 *   channels.list        →   1 unit
 *   playlistItems.list   →   1 unit
 */

import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

// -------------------------------------------------------------------
// Quota cost map — update if you add new call types
// -------------------------------------------------------------------
export const QUOTA_COSTS = {
  "search.list":        100,
  "videos.list":          1,
  "channels.list":        1,
  "playlistItems.list":   1,
  "default":              1,
};

// -------------------------------------------------------------------
// In-memory state  (survives within a single Next.js process)
// -------------------------------------------------------------------

/** @type {Map<string, { usedToday: number, exhaustedAt: number|null }>} */
const usageMap = new Map();

/** @type {Array<{ id: number, key: string, label: string, daily_quota: number, enabled: number }> | null} */
let keyPoolCache = null;
let poolLoadedAt  = 0;
const POOL_TTL_MS = 60_000; // re-read DB every 60 s so admin changes propagate

// Current rotation index — always try next key after a quota error
let rotationIdx = 0;

// -------------------------------------------------------------------
// Midnight-PT reset logic
// -------------------------------------------------------------------
function getMidnightPTTimestamp() {
  // YouTube resets at midnight America/Los_Angeles
  const now = new Date();
  const ptStr = now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" });
  const pt = new Date(ptStr);
  pt.setHours(24, 0, 0, 0); // next midnight PT
  return pt.getTime();
}

let nextResetAt = getMidnightPTTimestamp();

function maybeResetQuota() {
  if (Date.now() >= nextResetAt) {
    usageMap.clear();
    nextResetAt = getMidnightPTTimestamp();
    console.log("[KeyManager] Daily quota reset at midnight PT");
  }
}

// -------------------------------------------------------------------
// DB helpers
// -------------------------------------------------------------------
async function ensureTable() {
  // Create table if it doesn't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS youtube_api_keys (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      key         TEXT    NOT NULL UNIQUE,
      label       TEXT    NOT NULL DEFAULT '',
      daily_quota INTEGER NOT NULL DEFAULT 10000,
      enabled     INTEGER NOT NULL DEFAULT 1,
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    )
  `);

  // Migration: add any columns that may be missing in older schema versions
  // (Turso/SQLite doesn't support IF NOT EXISTS on ADD COLUMN in all versions,
  //  so we catch and ignore "duplicate column" errors gracefully)
  const migrations = [
    "ALTER TABLE youtube_api_keys ADD COLUMN label       TEXT    NOT NULL DEFAULT ''",
    "ALTER TABLE youtube_api_keys ADD COLUMN daily_quota INTEGER NOT NULL DEFAULT 10000",
    "ALTER TABLE youtube_api_keys ADD COLUMN enabled     INTEGER NOT NULL DEFAULT 1",
    "ALTER TABLE youtube_api_keys ADD COLUMN created_at  INTEGER NOT NULL DEFAULT (strftime('%s','now'))",
  ];
  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists — safe to ignore
    }
  }

  // Seed: if the table is empty and YOUTUBE_API_KEY env var is set, add it automatically
  const envKey = process.env.YOUTUBE_API_KEY;
  if (envKey) {
    try {
      const existing = await db.execute({
        sql: "SELECT id FROM youtube_api_keys WHERE key = ?",
        args: [envKey],
      });
      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO youtube_api_keys (key, label, daily_quota, enabled)
                VALUES (?, ?, 10000, 1)`,
          args: [envKey, "Default (from env)"],
        });
        console.log("[KeyManager] Seeded YOUTUBE_API_KEY env var into key pool");
      }
    } catch (err) {
      console.warn("[KeyManager] Could not seed env key:", err.message);
    }
  }
}

async function loadPool(force = false) {
  if (!force && keyPoolCache && Date.now() - poolLoadedAt < POOL_TTL_MS) {
    return keyPoolCache;
  }
  await ensureTable();
  const rs = await db.execute(
    "SELECT id, key, label, daily_quota, enabled FROM youtube_api_keys ORDER BY id ASC"
  );
  keyPoolCache = rs.rows.map((r) => ({
    id:          Number(r.id),
    key:         String(r.key),
    label:       String(r.label || ""),
    daily_quota: Number(r.daily_quota || 10000),
    enabled:     Number(r.enabled),
  }));
  poolLoadedAt = Date.now();
  return keyPoolCache;
}

// -------------------------------------------------------------------
// Public: get a usable API key (auto-rotates on exhaustion)
// -------------------------------------------------------------------
export async function getYouTubeApiKey(callType = "default") {
  maybeResetQuota();

  // Fall back to env var if no keys in DB yet
  const pool = await loadPool();
  const active = pool.filter((k) => k.enabled === 1);

  if (active.length === 0) {
    const envKey = process.env.YOUTUBE_API_KEY;
    if (envKey) return envKey;
    throw new Error("No YouTube API keys configured. Add one in Admin → API Keys.");
  }

  const cost = QUOTA_COSTS[callType] ?? QUOTA_COSTS["default"];

  // Try each key starting from rotationIdx
  for (let i = 0; i < active.length; i++) {
    const idx = (rotationIdx + i) % active.length;
    const k   = active[idx];
    const usage = usageMap.get(k.key) ?? { usedToday: 0, exhaustedAt: null };

    if (usage.exhaustedAt) continue; // skip exhausted

    if (usage.usedToday + cost <= k.daily_quota) {
      // Record anticipated usage optimistically
      usageMap.set(k.key, { ...usage, usedToday: usage.usedToday + cost });
      rotationIdx = idx; // stick to this key until it fills up
      return k.key;
    }
  }

  // All keys exhausted
  throw new Error(
    "All YouTube API keys have exhausted their daily quota. Resets at midnight Pacific Time."
  );
}

// -------------------------------------------------------------------
// Public: record actual quota usage after a successful call
// (call this instead of getYouTubeApiKey if you need exact tracking)
// -------------------------------------------------------------------
export function recordQuotaUsage(apiKey, callType = "default", units) {
  maybeResetQuota();
  const cost = units ?? QUOTA_COSTS[callType] ?? QUOTA_COSTS["default"];
  const prev = usageMap.get(apiKey) ?? { usedToday: 0, exhaustedAt: null };
  usageMap.set(apiKey, { ...prev, usedToday: prev.usedToday + cost });
}

// -------------------------------------------------------------------
// Public: mark a key as exhausted (call on 403 quotaExceeded)
// -------------------------------------------------------------------
export function markKeyExhausted(apiKey) {
  const prev = usageMap.get(apiKey) ?? { usedToday: 0, exhaustedAt: null };
  usageMap.set(apiKey, { ...prev, exhaustedAt: Date.now() });
  console.warn(`[KeyManager] Key ...${apiKey.slice(-6)} marked exhausted`);
  // Force rotation away from this key on next call
  rotationIdx = (rotationIdx + 1) % Math.max(1, (keyPoolCache?.filter(k => k.enabled)?.length ?? 1));
}

// -------------------------------------------------------------------
// Public: get live status (for admin UI)
// -------------------------------------------------------------------
export async function getKeyPoolStatus() {
  maybeResetQuota();
  const pool = await loadPool(true); // always fresh for admin
  return pool.map((k) => {
    const usage = usageMap.get(k.key) ?? { usedToday: 0, exhaustedAt: null };
    return {
      id:          k.id,
      label:       k.label,
      keyMasked:   maskKey(k.key),
      daily_quota: k.daily_quota,
      enabled:     k.enabled === 1,
      usedToday:   usage.usedToday,
      exhaustedAt: usage.exhaustedAt,
      pctUsed:     Math.min(100, Math.round((usage.usedToday / k.daily_quota) * 100)),
    };
  });
}

// -------------------------------------------------------------------
// Public: invalidate the in-memory pool cache (call after DB changes)
// -------------------------------------------------------------------
export function invalidatePoolCache() {
  keyPoolCache = null;
  poolLoadedAt = 0;
}

// -------------------------------------------------------------------
// Public: manually reset a single key's in-memory usage counter
// -------------------------------------------------------------------
export function resetKeyUsage(apiKey) {
  usageMap.set(apiKey, { usedToday: 0, exhaustedAt: null });
  console.log(`[KeyManager] Usage reset for key ...${apiKey.slice(-6)}`);
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function maskKey(key) {
  if (!key || key.length < 8) return "****";
  return key.slice(0, 4) + "..." + key.slice(-4);
}
