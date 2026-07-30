import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "@/lib/cache/turso";

export const dynamic = "force-dynamic";

/* ── GET /api/notifications — fetch user notifications + unread count ─────── */
export async function GET() {
  try {
    let userId = null;
    try {
      const session = await auth();
      userId = session?.userId || null;
    } catch { /* optional */ }

    if (!userId) {
      return NextResponse.json({ notifications: [], unread: 0 });
    }

    const [notifications, unread] = await Promise.all([
      getUserNotifications(userId, 30),
      getUnreadNotificationCount(userId),
    ]);

    return NextResponse.json({ notifications, unread });
  } catch (err) {
    console.error("[Notifications] GET error:", err);
    return NextResponse.json({ notifications: [], unread: 0 });
  }
}

/* ── PATCH /api/notifications — mark as read ─────────────────────────────── */
export async function PATCH(req) {
  try {
    let userId = null;
    try {
      const session = await auth();
      userId = session?.userId || null;
    } catch { /* optional */ }

    if (!userId) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    // If id is passed, mark just that one; otherwise mark all
    const notificationId = body.id || null;
    await markNotificationsRead(userId, notificationId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Notifications] PATCH error:", err);
    return NextResponse.json({ error: err?.message || "Failed" }, { status: 500 });
  }
}
