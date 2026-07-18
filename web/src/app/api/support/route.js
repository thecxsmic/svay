import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sendEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";

const TOPICS = new Set([
  "billing",
  "account",
  "bug",
  "feature",
  "refund",
  "other",
]);

const SUPPORT_TO = process.env.SUPPORT_EMAIL || "help@svay.space";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 200);
    const topic = String(body.topic || "other").trim().toLowerCase();
    const message = String(body.message || "").trim().slice(0, 4000);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Please write a short message (at least 10 characters)" },
        { status: 400 }
      );
    }
    if (!TOPICS.has(topic)) {
      return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
    }

    let userId = null;
    let clerkEmail = null;
    try {
      const session = await auth();
      userId = session?.userId || null;
      if (userId) {
        const user = await currentUser();
        clerkEmail = user?.emailAddresses?.[0]?.emailAddress || null;
      }
    } catch {
      // optional auth
    }

    const safeName = name || "Customer";
    const subject = `[Svay Support] ${topic.toUpperCase()} — ${safeName}`;

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin:0 0 12px">New support request</h2>
        <p style="margin:0 0 8px"><strong>Topic:</strong> ${topic}</p>
        <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(safeName)}</p>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${userId ? `<p style="margin:0 0 8px"><strong>Clerk user:</strong> ${escapeHtml(userId)}</p>` : ""}
        ${clerkEmail ? `<p style="margin:0 0 8px"><strong>Clerk email:</strong> ${escapeHtml(clerkEmail)}</p>` : ""}
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <p style="white-space:pre-wrap;line-height:1.5">${escapeHtml(message)}</p>
      </div>
    `;

    const text = [
      `Topic: ${topic}`,
      `Name: ${safeName}`,
      `Email: ${email}`,
      userId ? `Clerk user: ${userId}` : null,
      clerkEmail ? `Clerk email: ${clerkEmail}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const result = await sendEmail({
      to: SUPPORT_TO,
      subject,
      html,
      text,
      from: "Svay Support <insights@svay.space>",
    });

    if (!result.success) {
      console.error("[Support API] Email failed:", result.error);
      return NextResponse.json(
        {
          error:
            "Could not send your message right now. Email us directly at help@svay.space.",
        },
        { status: 502 }
      );
    }

    // Optional confirmation to the user (best-effort)
    try {
      await sendEmail({
        to: email,
        subject: "We received your message — Svay Support",
        html: `
          <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111">
            <h2 style="margin:0 0 12px">Thanks for reaching out</h2>
            <p>Hi ${escapeHtml(safeName)},</p>
            <p>We got your message about <strong>${escapeHtml(topic)}</strong> and will reply as soon as we can — usually within 24 hours on business days.</p>
            <p style="color:#666;font-size:13px">If you need to add anything, just reply to this email or write again from the Support page.</p>
            <p style="margin-top:24px">— Svay Care</p>
          </div>
        `,
        text: `Hi ${safeName},\n\nWe received your support request (${topic}) and will get back to you soon.\n\n— Svay Care`,
        from: "Svay Support <insights@svay.space>",
      });
    } catch (e) {
      console.warn("[Support API] Confirmation email skipped:", e?.message);
    }

    return NextResponse.json({
      success: true,
      message: "Message sent. We'll get back to you soon.",
    });
  } catch (error) {
    console.error("[Support API] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit support request" },
      { status: 500 }
    );
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
