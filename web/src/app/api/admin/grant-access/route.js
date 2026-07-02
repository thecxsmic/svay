import { NextResponse } from "next/server";
import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN || "",
});

// Create Clerk Client using environment secret key
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function verifyAdmin() {
  const { userId } = await auth();
  if (!userId) return { authorized: false, error: "Unauthorized", status: 401 };

  try {
    const user = await currentUser();
    const userEmail = user?.emailAddresses[0]?.emailAddress;
    if (userEmail !== "thecxsmic@gmail.com") {
      return { authorized: false, error: "Forbidden", status: 403 };
    }
    return { authorized: true, userId };
  } catch (e) {
    console.error("[Admin Grant API] Admin check failed:", e);
    return { authorized: false, error: "Authentication failed", status: 500 };
  }
}

export async function POST(req) {
  const adminCheck = await verifyAdmin();
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { userIdOrEmail, duration_days } = body;

    if (!userIdOrEmail || typeof userIdOrEmail !== "string") {
      return NextResponse.json({ error: "User Email or Clerk ID is required" }, { status: 400 });
    }

    const days = parseInt(duration_days, 10);
    if (isNaN(days) || days <= 0) {
      return NextResponse.json({ error: "Duration (days) must be a positive number" }, { status: 400 });
    }

    const input = userIdOrEmail.trim();
    let targetUserId = "";
    let targetEmail = "";
    let targetName = "";

    // 1. Resolve target user ID
    if (input.includes("@")) {
      // Find by email address
      console.log(`[Admin Grant] Searching Clerk for email: ${input}`);
      const userList = await clerk.users.getUserList({
        emailAddress: [input],
        limit: 1,
      });

      if (!userList.data || userList.data.length === 0) {
        return NextResponse.json({ error: `No user found in Clerk with email "${input}"` }, { status: 404 });
      }

      const match = userList.data[0];
      targetUserId = match.id;
      targetEmail = match.emailAddresses.find(e => e.emailAddress === input)?.emailAddress || match.emailAddresses[0]?.emailAddress || "";
      targetName = `${match.firstName || ""} ${match.lastName || ""}`.trim() || match.username || "User";
    } else {
      // Treat as direct Clerk User ID
      console.log(`[Admin Grant] Searching Clerk for user ID: ${input}`);
      try {
        const match = await clerk.users.getUser(input);
        targetUserId = match.id;
        targetEmail = match.emailAddresses[0]?.emailAddress || "";
        targetName = `${match.firstName || ""} ${match.lastName || ""}`.trim() || match.username || "User";
      } catch (err) {
        console.warn(`[Admin Grant] Could not find user by ID in Clerk: ${input}`, err);
        return NextResponse.json({ error: `User with Clerk ID "${input}" not found` }, { status: 404 });
      }
    }

    // 2. Grant Access
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (days * 24 * 60 * 60);
    const subscriptionId = `admin_grant_${Math.random().toString(36).substring(2, 10)}`;
    const planId = `admin_grant_${days}d`;

    await client.execute({
      sql: `INSERT OR REPLACE INTO user_subscriptions (user_id, subscription_id, plan_id, status, current_period_end, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [targetUserId, subscriptionId, planId, "active", expiresAt, now],
    });

    console.log(`[Admin Grant] Successfully granted ${days} days to ${targetEmail} (${targetUserId})`);

    return NextResponse.json({
      success: true,
      message: `Successfully granted ${days} days of Pro access to ${targetName} (${targetEmail}).`,
      details: {
        userId: targetUserId,
        email: targetEmail,
        name: targetName,
        expiresAt,
      }
    });
  } catch (error) {
    console.error("[Admin Grant API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to grant access to user" },
      { status: 500 }
    );
  }
}
