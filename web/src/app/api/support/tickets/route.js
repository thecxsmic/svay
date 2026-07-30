import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import {
  createSupportTicket,
  getUserTickets,
} from "@/lib/cache/turso";
import { sendEmail } from "@/lib/email/resend";
import {
  APP_URL,
  EMAIL,
  escapeHtml,
  emailLayout,
  card,
} from "@/lib/email/layout";

export const dynamic = "force-dynamic";

const TOPICS = new Set(["billing", "account", "bug", "feature", "refund", "other"]);
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "help@svay.space";

function ticketConfirmEmail({ name, ticketId, topic, subject }) {
  const link = `${APP_URL}/support?ticket=${ticketId}`;
  const body = `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${EMAIL.textSecondary};">
      Hi <strong style="color:${EMAIL.white};font-weight:600;">${escapeHtml(name)}</strong>,
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${EMAIL.textSecondary};">
      We've received your support request and created a ticket for it.
      Our team will respond as soon as possible — usually within 24 hours on business days.
    </p>
    ${card(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid ${EMAIL.border};">
            <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL.textMuted};">Ticket ID</p>
            <p style="margin:4px 0 0 0;font-size:13px;color:${EMAIL.text};font-family:${EMAIL.mono};">${escapeHtml(ticketId)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;border-bottom:1px solid ${EMAIL.border};">
            <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL.textMuted};">Topic</p>
            <p style="margin:4px 0 0 0;font-size:13px;color:${EMAIL.text};">${escapeHtml(topic)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0 0 0;">
            <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL.textMuted};">Subject</p>
            <p style="margin:4px 0 0 0;font-size:13px;color:${EMAIL.text};">${escapeHtml(subject)}</p>
          </td>
        </tr>
      </table>
    `)}
    <p style="margin:16px 0 0 0;font-size:13px;line-height:1.55;color:${EMAIL.textMuted};">
      You can track your ticket status and see our replies directly in the Svay Support Center.
    </p>
  `;
  return {
    subject: `[Ticket #${ticketId.slice(-8)}] We received your request — Svay Support`,
    html: emailLayout({
      preheader: `Your support ticket has been created. We'll get back to you soon.`,
      eyebrow: "Support",
      title: "Your ticket is open",
      body,
      ctaLabel: "View your ticket",
      ctaHref: link,
      footerNote: "You received this because you submitted a support request on Svay.",
    }),
    text: `Hi ${name},\n\nYour support ticket (${ticketId}) has been created.\nTopic: ${topic}\nSubject: ${subject}\n\nTrack it here: ${link}\n\n— Svay Support`,
  };
}

/* ── POST /api/support/tickets — create a new ticket ─────────────────────── */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 200);
    const topic = String(body.topic || "other").trim().toLowerCase();
    const subject = String(body.subject || "").trim().slice(0, 200);
    const message = String(body.message || "").trim().slice(0, 4000);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!subject || subject.length < 3) {
      return NextResponse.json({ error: "Please provide a subject" }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: "Please write at least 10 characters" }, { status: 400 });
    }
    if (!TOPICS.has(topic)) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

    let userId = null;
    try {
      const session = await auth();
      userId = session?.userId || null;
    } catch { /* optional */ }

    const safeName = name || "Customer";

    // Create the ticket in DB
    const ticketId = await createSupportTicket({
      userId,
      userEmail: email,
      userName: safeName,
      topic,
      subject,
      message,
    });

    // Send ONE confirmation email to the user (best-effort)
    try {
      const emailData = ticketConfirmEmail({ name: safeName, ticketId, topic, subject });
      await sendEmail({
        to: email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        from: `Svay Support <${SUPPORT_EMAIL}>`,
      });
    } catch (emailErr) {
      console.warn("[Support Tickets] Confirmation email failed:", emailErr?.message);
    }

    return NextResponse.json({ success: true, ticketId });
  } catch (err) {
    console.error("[Support Tickets] POST error:", err);
    return NextResponse.json({ error: err?.message || "Failed to create ticket" }, { status: 500 });
  }
}

/* ── GET /api/support/tickets — list current user's tickets ──────────────── */
export async function GET() {
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

    if (!userId && !userEmail) {
      return NextResponse.json({ tickets: [] });
    }

    const tickets = await getUserTickets(userId, userEmail);
    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("[Support Tickets] GET error:", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch tickets" }, { status: 500 });
  }
}
