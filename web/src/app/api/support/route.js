import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sendEmail } from "@/lib/email/resend";
import {
  supportTicketEmail,
  supportConfirmationEmail,
} from "@/lib/email/templates";

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

    const ticket = supportTicketEmail({
      topic,
      name: safeName,
      email,
      message,
      userId,
      clerkEmail,
    });

    const result = await sendEmail({
      to: SUPPORT_TO,
      subject: ticket.subject,
      html: ticket.html,
      text: ticket.text,
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
      const confirmation = supportConfirmationEmail({
        name: safeName,
        topic,
      });
      await sendEmail({
        to: email,
        subject: confirmation.subject,
        html: confirmation.html,
        text: confirmation.text,
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
