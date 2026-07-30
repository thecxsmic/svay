import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getAllTickets,
  getTicketById,
  getTicketMessages,
  addTicketMessage,
  updateTicketStatus,
  createNotification,
} from "@/lib/cache/turso";

export const dynamic = "force-dynamic";

const ADMIN_IDS = (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);

async function assertAdmin() {
  const session = await auth();
  const userId = session?.userId;
  if (!userId) throw new Error("Unauthenticated");
  if (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(userId)) throw new Error("Forbidden");
  return userId;
}

/* ── GET /api/admin/tickets — list all tickets ───────────────────────────── */
export async function GET(req) {
  try {
    await assertAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const tickets = await getAllTickets({ status, limit: 100 });
    return NextResponse.json({ tickets });
  } catch (err) {
    const status = err.message === "Forbidden" ? 403 : err.message === "Unauthenticated" ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

/* ── POST /api/admin/tickets — admin reply or status update ──────────────── */
export async function POST(req) {
  try {
    const adminId = await assertAdmin();
    const body = await req.json().catch(() => ({}));

    const ticketId = String(body.ticketId || "").trim();
    const message = String(body.message || "").trim().slice(0, 4000);
    const newStatus = String(body.status || "").trim();

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId required" }, { status: 400 });
    }

    const ticket = await getTicketById(ticketId, { isAdmin: true });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Status-only update (no message required)
    if (newStatus && !message) {
      await updateTicketStatus(ticketId, newStatus);
      // Notify the user if they have a userId
      if (ticket.user_id) {
        await createNotification({
          userId: ticket.user_id,
          title: "Ticket status updated",
          message: `Your ticket "${ticket.subject}" has been updated to ${newStatus}.`,
          link: `/support?ticket=${ticketId}`,
        });
      }
      return NextResponse.json({ success: true });
    }

    // Reply (message required)
    if (!message || message.length < 2) {
      return NextResponse.json({ error: "Message too short" }, { status: 400 });
    }

    await addTicketMessage({
      ticketId,
      senderType: "admin",
      senderId: adminId,
      senderName: "Svay Support",
      message,
      newStatus: newStatus || "in_progress",
    });

    // Create an in-app notification for the ticket owner
    if (ticket.user_id) {
      await createNotification({
        userId: ticket.user_id,
        title: "Support replied to your ticket",
        message: `Re: ${ticket.subject}`,
        link: `/support?ticket=${ticketId}`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const status = err.message === "Forbidden" ? 403 : err.message === "Unauthenticated" ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
