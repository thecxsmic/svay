/**
 * Durable + in-memory quota enforcement for free public tools.
 *
 * Layers:
 *  1. Burst rate limit (memory sliding window)
 *  2. Daily per-tool + global counters (Turso, fallback memory)
 *  3. IP caps (cookie / multi-account rotation defense)
 *  4. Account tier (anonymous | free | demo | pro)
 */

import { createClient } from "@libsql/client";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { getSubscriptionStatus } from "@/lib/auth/subscription";
import {
  TOOLS_SID_COOKIE,
  TIER_LIMITS,
  TOOL_IDS,
  TOOL_META,
} from "./config";

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

/** In-process fallback when Turso is unavailable */
const memDaily = new Map(); // key -> count

let tableReady = false;

function utcDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function secondsUntilUtcMidnight() {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return Math.max(1, Math.floor((next.getTime() - now.getTime()) / 1000));
}

async function ensureTable() {
  if (tableReady || !process.env.TURSO_DATABASE_URL) return;
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS tool_usage (
        subject_key TEXT NOT NULL,
        tool_id TEXT NOT NULL,
        day TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (subject_key, tool_id, day)
      )
    `);
    tableReady = true;
  } catch (err) {
    console.error("[Tools Quota] ensureTable failed:", err);
  }
}

function memKey(subject, toolId, day) {
  return `${subject}|${toolId}|${day}`;
}

async function getCount(subject, toolId, day) {
  if (!process.env.TURSO_DATABASE_URL) {
    return memDaily.get(memKey(subject, toolId, day)) || 0;
  }
  try {
    await ensureTable();
    const rs = await turso.execute({
      sql: `SELECT count FROM tool_usage WHERE subject_key = ? AND tool_id = ? AND day = ?`,
      args: [subject, toolId, day],
    });
    return rs.rows[0]?.count ? Number(rs.rows[0].count) : 0;
  } catch (err) {
    console.error("[Tools Quota] getCount failed:", err);
    return memDaily.get(memKey(subject, toolId, day)) || 0;
  }
}

async function incrementCount(subject, toolId, day, by = 1) {
  const k = memKey(subject, toolId, day);
  memDaily.set(k, (memDaily.get(k) || 0) + by);

  if (!process.env.TURSO_DATABASE_URL) return memDaily.get(k);

  try {
    await ensureTable();
    const now = Math.floor(Date.now() / 1000);
    await turso.execute({
      sql: `
        INSERT INTO tool_usage (subject_key, tool_id, day, count, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(subject_key, tool_id, day)
        DO UPDATE SET count = count + ?, updated_at = ?
      `,
      args: [subject, toolId, day, by, now, by, now],
    });
    return await getCount(subject, toolId, day);
  } catch (err) {
    console.error("[Tools Quota] incrementCount failed:", err);
    return memDaily.get(k);
  }
}

function newSid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Resolve client IP from common proxy headers.
 */
export function getClientIp(request) {
  const h = request.headers;
  const xf = h.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim().slice(0, 64);
  return (
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    request.ip ||
    "unknown"
  )
    .toString()
    .slice(0, 64);
}

/**
 * Ensure anonymous tools session cookie exists; returns sid + whether to set cookie.
 */
export async function resolveAnonSid() {
  const jar = await cookies();
  const existing = jar.get(TOOLS_SID_COOKIE)?.value;
  if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) {
    return { sid: existing, setCookie: false };
  }
  const sid = newSid();
  return { sid, setCookie: true };
}

export function toolsSidCookieOptions(sid) {
  return {
    name: TOOLS_SID_COOKIE,
    value: sid,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  };
}

/**
 * Determine account tier for the current request.
 */
export async function resolveToolIdentity(request) {
  const ip = getClientIp(request);
  const { sid, setCookie } = await resolveAnonSid();

  // Demo mode via cookie (no real Clerk session)
  const jar = await cookies();
  const isDemo = jar.get("demo_mode")?.value === "true";

  let userId = null;
  let isPro = false;

  try {
    const a = await auth();
    userId = a?.userId || null;
  } catch {
    userId = null;
  }

  if (userId) {
    const sub = await getSubscriptionStatus(userId);
    isPro = !!sub?.isActive;
  }

  let tier = "anonymous";
  if (isDemo && !userId) tier = "demo";
  else if (userId && isPro) tier = "pro";
  else if (userId) tier = "free";

  const limits = TIER_LIMITS[tier];

  const subjectKey = userId
    ? `user:${userId}`
    : isDemo
      ? `demo:${sid}`
      : `anon:${sid}`;
  const ipKey = `ip:${ip}`;

  return {
    tier,
    limits,
    subjectKey,
    ipKey,
    userId,
    isPro,
    isDemo,
    isSignedIn: !!userId,
    sid,
    setCookie,
    ip,
  };
}

/**
 * Read-only usage snapshot for UI.
 */
export async function getQuotaSnapshot(identity, toolId = null) {
  const day = utcDay();
  const { subjectKey, ipKey, limits, tier } = identity;

  const [globalUsed, ipGlobalUsed, toolUsed] = await Promise.all([
    getCount(subjectKey, "*", day),
    getCount(ipKey, "*", day),
    toolId ? getCount(subjectKey, toolId, day) : Promise.resolve(0),
  ]);

  const remainingGlobal = Math.max(0, limits.dailyGlobal - globalUsed);
  const remainingIp = Math.max(0, limits.ipDailyGlobal - ipGlobalUsed);
  const remainingTool = toolId
    ? Math.max(0, limits.dailyPerTool - toolUsed)
    : null;

  const remaining = Math.min(
    remainingGlobal,
    remainingIp,
    remainingTool == null ? Infinity : remainingTool
  );

  const tools = {};
  await Promise.all(
    TOOL_IDS.map(async (id) => {
      const used = await getCount(subjectKey, id, day);
      tools[id] = {
        id,
        name: TOOL_META[id]?.name || id,
        used,
        limit: limits.dailyPerTool,
        remaining: Math.max(0, limits.dailyPerTool - used),
      };
    })
  );

  return {
    tier,
    tierLabel: limits.label,
    day,
    resetsInSeconds: secondsUntilUtcMidnight(),
    global: {
      used: globalUsed,
      limit: limits.dailyGlobal,
      remaining: remainingGlobal,
    },
    ip: {
      used: ipGlobalUsed,
      limit: limits.ipDailyGlobal,
      remaining: remainingIp,
    },
    tool: toolId
      ? {
          id: toolId,
          used: toolUsed,
          limit: limits.dailyPerTool,
          remaining: remainingTool,
        }
      : null,
    tools,
    remaining: remaining === Infinity ? remainingGlobal : remaining,
    canRun: remaining > 0,
    isSignedIn: identity.isSignedIn,
    isPro: identity.isPro,
    isDemo: identity.isDemo,
    limits: {
      dailyGlobal: limits.dailyGlobal,
      dailyPerTool: limits.dailyPerTool,
      burstPerMin: limits.burstPerMin,
    },
    upgrades: {
      signIn: !identity.isSignedIn && !identity.isDemo,
      pro: identity.isSignedIn && !identity.isPro,
    },
  };
}

/**
 * Enforce burst + daily quotas, then consume one unit if allowed.
 * @returns {{ ok: true, snapshot } | { ok: false, status: number, error: string, code: string, snapshot, retryAfter? }}
 */
export async function consumeToolQuota(identity, toolId) {
  if (!TOOL_IDS.includes(toolId)) {
    return {
      ok: false,
      status: 400,
      error: "Unknown tool",
      code: "UNKNOWN_TOOL",
      snapshot: await getQuotaSnapshot(identity),
    };
  }

  const { subjectKey, ipKey, limits } = identity;
  const day = utcDay();

  // 1) Burst limits (subject + IP)
  const burstSubject = checkRateLimit(
    `tools:burst:${subjectKey}`,
    limits.burstPerMin,
    60_000
  );
  if (burstSubject.limited) {
    return {
      ok: false,
      status: 429,
      error: `Too many requests. Max ${limits.burstPerMin}/min on your ${limits.label} plan.`,
      code: "BURST_LIMIT",
      retryAfter: Math.max(
        1,
        Math.ceil((burstSubject.reset - Date.now()) / 1000)
      ),
      snapshot: await getQuotaSnapshot(identity, toolId),
    };
  }

  const burstIp = checkRateLimit(
    `tools:burst:${ipKey}`,
    limits.ipBurstPerMin,
    60_000
  );
  if (burstIp.limited) {
    return {
      ok: false,
      status: 429,
      error: "Network rate limit exceeded. Slow down and try again shortly.",
      code: "IP_BURST_LIMIT",
      retryAfter: Math.max(1, Math.ceil((burstIp.reset - Date.now()) / 1000)),
      snapshot: await getQuotaSnapshot(identity, toolId),
    };
  }

  // 2) Daily counters (read before write)
  const [globalUsed, toolUsed, ipGlobalUsed] = await Promise.all([
    getCount(subjectKey, "*", day),
    getCount(subjectKey, toolId, day),
    getCount(ipKey, "*", day),
  ]);

  if (globalUsed >= limits.dailyGlobal) {
    return {
      ok: false,
      status: 429,
      error: dailyLimitMessage(identity, "global"),
      code: "DAILY_GLOBAL_LIMIT",
      snapshot: await getQuotaSnapshot(identity, toolId),
    };
  }

  if (toolUsed >= limits.dailyPerTool) {
    return {
      ok: false,
      status: 429,
      error: dailyLimitMessage(identity, "tool"),
      code: "DAILY_TOOL_LIMIT",
      snapshot: await getQuotaSnapshot(identity, toolId),
    };
  }

  if (ipGlobalUsed >= limits.ipDailyGlobal) {
    return {
      ok: false,
      status: 429,
      error:
        "This network has hit today's free-tool limit. Sign in or try again tomorrow.",
      code: "IP_DAILY_LIMIT",
      snapshot: await getQuotaSnapshot(identity, toolId),
    };
  }

  // 3) Consume (subject global + tool + IP global)
  await Promise.all([
    incrementCount(subjectKey, "*", day, 1),
    incrementCount(subjectKey, toolId, day, 1),
    incrementCount(ipKey, "*", day, 1),
  ]);

  const snapshot = await getQuotaSnapshot(identity, toolId);
  return { ok: true, snapshot };
}

function dailyLimitMessage(identity, kind) {
  const { tier, limits, isSignedIn, isPro } = identity;
  if (tier === "anonymous") {
    return kind === "tool"
      ? `Guest limit: ${limits.dailyPerTool} uses/day on this tool. Sign in free for higher limits.`
      : `Guest daily limit (${limits.dailyGlobal}) reached. Create a free account for more runs.`;
  }
  if (!isPro && isSignedIn) {
    return kind === "tool"
      ? `Free account limit: ${limits.dailyPerTool}/day on this tool. Upgrade to Pro for higher caps.`
      : `Free account daily limit (${limits.dailyGlobal}) reached. Upgrade to Pro or wait until UTC midnight.`;
  }
  if (tier === "demo") {
    return "Demo daily tool limit reached. Sign in with a real account for more access.";
  }
  return "Daily tool limit reached. Resets at UTC midnight.";
}

/**
 * Attach quota headers to a response Headers object.
 */
export function quotaHeaders(snapshot, extra = {}) {
  const h = { ...extra };
  if (!snapshot) return h;
  h["X-Tools-Tier"] = snapshot.tier;
  h["X-Tools-Limit-Global"] = String(snapshot.global.limit);
  h["X-Tools-Remaining-Global"] = String(snapshot.global.remaining);
  h["X-Tools-Reset"] = String(snapshot.resetsInSeconds);
  if (snapshot.tool) {
    h["X-Tools-Limit-Tool"] = String(snapshot.tool.limit);
    h["X-Tools-Remaining-Tool"] = String(snapshot.tool.remaining);
  }
  return h;
}
