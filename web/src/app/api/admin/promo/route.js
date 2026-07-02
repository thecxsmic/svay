import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

// Admin verification helper
async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) return { authorized: false, error: "Unauthorized", status: 401 };

  try {
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    if (userEmail !== "thecxsmic@gmail.com") {
      return { authorized: false, error: "Forbidden", status: 403 };
    }
    return { authorized: true, userId, email: userEmail };
  } catch (e) {
    console.error("[Admin API] Failed to check currentUser:", e);
    return { authorized: false, error: "Authentication failed", status: 500 };
  }
}

// GET: List all promo codes and some recent redemptions
export async function GET(req) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const codesResult = await client.execute(
      "SELECT * FROM promo_codes ORDER BY created_at DESC"
    );

    const redemptionsResult = await client.execute(
      `SELECT r.*, s.plan_id 
       FROM promo_redemptions r 
       LEFT JOIN user_subscriptions s ON r.user_id = s.user_id 
       ORDER BY r.redeemed_at DESC LIMIT 50`
    );

    return NextResponse.json({
      codes: codesResult.rows,
      redemptions: redemptionsResult.rows,
    });
  } catch (error) {
    console.error("[Admin Promo API] GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch promo data" }, { status: 500 });
  }
}

// POST: Create a new promo code
export async function POST(req) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { code: rawCode, duration_days, expires_at, max_uses } = body;

    if (!rawCode || typeof rawCode !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Code cannot be empty" }, { status: 400 });
    }

    const days = parseInt(duration_days, 10);
    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ error: "Duration (days) must be a positive number" }, { status: 400 });
    }

    const expiresAtVal = expires_at ? parseInt(expires_at, 10) : null;
    const maxUsesVal = max_uses ? parseInt(max_uses, 10) : null;
    const now = Math.floor(Date.now() / 1000);

    // Check if code already exists
    const checkExist = await client.execute({
      sql: "SELECT code FROM promo_codes WHERE code = ?",
      args: [code],
    });

    if (checkExist.rows.length > 0) {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 400 });
    }

    await client.execute({
      sql: `INSERT INTO promo_codes (code, duration_days, expires_at, max_uses, uses_count, created_at)
            VALUES (?, ?, ?, ?, 0, ?)`,
      args: [code, days, expiresAtVal, maxUsesVal, now],
    });

    return NextResponse.json({ success: true, message: `Promo code ${code} created successfully.` });
  } catch (error) {
    console.error("[Admin Promo API] POST Error:", error);
    return NextResponse.json({ error: "Failed to create promo code" }, { status: 500 });
  }
}

// DELETE: Delete a promo code
export async function DELETE(req) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    // Delete redemptions first due to foreign key
    await client.execute({
      sql: "DELETE FROM promo_redemptions WHERE code = ?",
      args: [code],
    });

    const result = await client.execute({
      sql: "DELETE FROM promo_codes WHERE code = ?",
      args: [code],
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Promo code ${code} deleted successfully.` });
  } catch (error) {
    console.error("[Admin Promo API] DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete promo code" }, { status: 500 });
  }
}
