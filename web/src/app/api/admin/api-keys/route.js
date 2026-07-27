import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@libsql/client";
import {
  getKeyPoolStatus,
  invalidatePoolCache,
  markKeyExhausted,
} from "@/lib/youtube/apiKeyManager";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) return { authorized: false, error: "Unauthorized", status: 401 };
  try {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;
    if (email !== "thecxsmic@gmail.com") {
      return { authorized: false, error: "Forbidden", status: 403 };
    }
    return { authorized: true };
  } catch {
    return { authorized: false, error: "Authentication failed", status: 500 };
  }
}

async function ensureTable() {
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
}

// GET — list all keys with live usage stats
export async function GET(req) {
  const check = await verifyAdmin();
  if (!check.authorized) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    await ensureTable();
    const status = await getKeyPoolStatus();
    return NextResponse.json({ keys: status });
  } catch (err) {
    console.error("[Admin API Keys] GET error:", err);
    return NextResponse.json({ error: "Failed to load API keys" }, { status: 500 });
  }
}

// POST — add a new key | toggle enabled | update quota | reset usage
export async function POST(req) {
  const check = await verifyAdmin();
  if (!check.authorized) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    await ensureTable();
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // ── Add new key ──────────────────────────────────────────────
    if (action === "add") {
      const rawKey = (body.key || "").trim();
      const label  = (body.label || "").trim().slice(0, 64);
      const quota  = parseInt(body.daily_quota, 10);

      if (!rawKey) {
        return NextResponse.json({ error: "API key is required" }, { status: 400 });
      }
      if (isNaN(quota) || quota < 1) {
        return NextResponse.json({ error: "daily_quota must be a positive number" }, { status: 400 });
      }

      // Check for duplicate
      const exists = await db.execute({
        sql: "SELECT id FROM youtube_api_keys WHERE key = ?",
        args: [rawKey],
      });
      if (exists.rows.length > 0) {
        return NextResponse.json({ error: "This API key already exists" }, { status: 400 });
      }

      await db.execute({
        sql: `INSERT INTO youtube_api_keys (key, label, daily_quota, enabled)
              VALUES (?, ?, ?, 1)`,
        args: [rawKey, label, quota],
      });
      invalidatePoolCache();
      return NextResponse.json({ success: true, message: "API key added" });
    }

    // ── Toggle enabled/disabled ───────────────────────────────────
    if (action === "toggle") {
      const { id, enabled } = body;
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

      await db.execute({
        sql: "UPDATE youtube_api_keys SET enabled = ? WHERE id = ?",
        args: [enabled ? 1 : 0, id],
      });
      invalidatePoolCache();
      return NextResponse.json({ success: true, message: `Key ${enabled ? "enabled" : "disabled"}` });
    }

    // ── Update label or daily quota ───────────────────────────────
    if (action === "update_quota") {
      const { id, daily_quota, label } = body;
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

      const quota = parseInt(daily_quota, 10);
      if (isNaN(quota) || quota < 1) {
        return NextResponse.json({ error: "daily_quota must be a positive number" }, { status: 400 });
      }

      await db.execute({
        sql: "UPDATE youtube_api_keys SET daily_quota = ?, label = ? WHERE id = ?",
        args: [quota, (label || "").trim().slice(0, 64), id],
      });
      invalidatePoolCache();
      return NextResponse.json({ success: true, message: "Quota updated" });
    }

    // ── Reset in-memory usage for a key ──────────────────────────
    if (action === "reset_usage") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

      // We need the actual key string to clear its usageMap entry
      const rs = await db.execute({
        sql: "SELECT key FROM youtube_api_keys WHERE id = ?",
        args: [id],
      });
      if (rs.rows.length === 0) {
        return NextResponse.json({ error: "Key not found" }, { status: 404 });
      }
      // Import and directly reset via markKeyExhausted false-reset trick:
      // re-export usageMap via a dedicated clear helper isn't worth the coupling;
      // instead we call markKeyExhausted then immediately un-exhaust by calling
      // the exported reset function — simpler: just restart the usage to 0 via
      // a module-level export we added.
      const { resetKeyUsage } = await import("@/lib/youtube/apiKeyManager");
      resetKeyUsage(String(rs.rows[0].key));
      return NextResponse.json({ success: true, message: "Usage counter reset" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[Admin API Keys] POST error:", err);
    return NextResponse.json({ error: err.message || "Operation failed" }, { status: 500 });
  }
}

// DELETE — permanently remove a key
export async function DELETE(req) {
  const check = await verifyAdmin();
  if (!check.authorized) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id"), 10);

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const result = await db.execute({
      sql: "DELETE FROM youtube_api_keys WHERE id = ?",
      args: [id],
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    invalidatePoolCache();
    return NextResponse.json({ success: true, message: "API key deleted" });
  } catch (err) {
    console.error("[Admin API Keys] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
  }
}
