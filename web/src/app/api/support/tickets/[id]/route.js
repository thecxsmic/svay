import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getTicketById,
  getTicketMessages,
  addTicketMessage,
  createNotification,
} from "@/lib/cache/turso";

export const dynamic = "force-dynamic";

/* ── GET /api/support/tickets/[id] — get ticket + messages ───────────────── */
export async function GET(req, { params }) {
  const { id: ticketId } = await params;
  try {
    let userId = null;
    let userEmail = null;
    try {
      const session = await auth();
      userId = session?.userId || null;
      if (userId) {
        const user = await currentUser();
        userEmail = user?.emailAddresses?.[0]?.emailAddress || null;
      }
    } catch { /* optional */ }

    const ticket = await getTicketById(ticketId, { userId, userEmail, isAdmin: false });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const messages = await getTicketMessages(ticketId);
    return NextResponse.json({ ticket, messages });
  } catch (err) {
    console.error("[Ticket Detail] GET error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch ticket" }, { status: 500 });
  }
}

/* ── POST /api/support/tickets/[id] — user replies to their ticket ────────── */
export async function POST(req, { params }) {
  const { id: ticketId } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim().slice(0, 4000);
    if (!message || message.length < 2) {
      return NextResponse.json({ error: "Message too short" }, { status: 400 });
    }

    let userId = null;
    let userName = "Customer";
    let userEmail = null;

    try {
      const session = await auth();
      userId = session?.userId || null;
      if (userId) {
        const user = await currentUser();
        userEmail = user?.emailAddresses?.[0]?.emailAddress || null;
        userName = user?.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : (user?.username || "Customer");
      }
    } catch { /* optional */ }

    // Verify ownership
    const ticket = await getTicketById(ticketId, { userId, userEmail, isAdmin: false });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Don't allow replies on closed tickets
    if (ticket.status === "closed") {
      return NextResponse.json({ error: "This ticket is closed" }, { status: 400 });
    }

    await addTicketMessage({
      ticketId,
      senderType: "user",
      senderId: userId || userEmail || "guest",
      senderName: userName,
      message,
      newStatus: "waiting_admin",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Ticket Detail] POST error:", err);
    return NextResponse.json({ error: err?.message || "Failed to send reply" }, { status: 500 });
  }
}
