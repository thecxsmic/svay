"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/contexts/user";
import {
  LifeBuoy,
  MessageSquare,
  BookOpen,
  CreditCard,
  ChevronDown,
  Plus,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Circle,
} from "lucide-react";
import {
  DashPage,
  DashToolbar,
  DashBody,
  DashAlert,
  DashButton,
  DashPanel,
  MetaChip,
} from "../components/dashboard/ui";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const TOPICS = [
  { id: "billing", label: "Billing & plans" },
  { id: "account", label: "Account access" },
  { id: "bug", label: "Bug / something broken" },
  { id: "feature", label: "Feature request" },
  { id: "refund", label: "Refund request" },
  { id: "other", label: "Other" },
];

const FAQS = [
  {
    q: "How do I cancel or update my subscription?",
    a: "Open Billing from the menu (or the Pro badge). You can cancel at period end, resume a pending cancel, or manage payment in the billing portal.",
    href: "/billing",
    linkLabel: "Go to Billing",
  },
  {
    q: "I paid but still see the upgrade screen.",
    a: "After checkout, wait a few seconds and refresh. If it still blocks you, open Billing and use Refresh, or send us a message with the email you paid with.",
    href: "/billing",
    linkLabel: "Open Billing",
  },
  {
    q: "Where can I learn how features work?",
    a: "Docs cover Search, Trends, Competitors, Library, and Analytics with short how-to steps.",
    href: "/docs",
    linkLabel: "Open Docs",
  },
  {
    q: "What is your refund policy?",
    a: "Refund rules are listed on our refund page. For billing disputes, contact us with your account email and approximate payment date.",
    href: "/refund",
    linkLabel: "Refund policy",
  },
];

const QUICK = [
  { title: "Billing", desc: "Plans, cancel, payment method", href: "/billing", icon: CreditCard },
  { title: "Docs", desc: "How to use Svay tools", href: "/docs", icon: BookOpen },
];

const STATUS_CONFIG = {
  open: { label: "Open", color: "text-emerald-400", bg: "bg-emerald-500/[0.08] border-emerald-500/20", icon: Circle },
  in_progress: { label: "In Progress", color: "text-[#00f0ff]", bg: "bg-[#00f0ff]/[0.08] border-[#00f0ff]/20", icon: RefreshCw },
  waiting_admin: { label: "Waiting on us", color: "text-amber-400", bg: "bg-amber-500/[0.08] border-amber-500/20", icon: Clock },
  waiting_user: { label: "Waiting on you", color: "text-violet-400", bg: "bg-violet-500/[0.08] border-violet-500/20", icon: Clock },
  resolved: { label: "Resolved", color: "text-zinc-500", bg: "bg-zinc-500/[0.08] border-zinc-500/20", icon: CheckCircle2 },
  closed: { label: "Closed", color: "text-zinc-600", bg: "bg-zinc-700/[0.08] border-zinc-700/20", icon: CheckCircle2 },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.color} ${cfg.bg}`}>
      <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function timeAgo(ms) {
  const diff = Date.now() - Number(ms);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(ms) {
  return new Date(Number(ms)).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Tab: New Ticket Form ───────────────────────────────────────────────── */

function NewTicketForm({ user, onCreated }) {
  const [topic, setTopic] = useState("billing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.name) setName((n) => n || user.name);
    if (user?.email) setEmail((e) => e || user.email);
  }, [user]);

  const topicLabel = useMemo(() => TOPICS.find((t) => t.id === topic)?.label || "Other", [topic]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ticket");
      onCreated(data.ticketId);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashPanel title="Open a new ticket" icon={MessageSquare} bodyClassName="p-4 sm:p-5">
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <DashAlert variant="error">{error}</DashAlert>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Email *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Topic</span>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full cursor-pointer rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-600"
          >
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Subject *</span>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={`Short description — e.g. "Can't access Pro after payment"`}
            className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
            Message * · {topicLabel}
          </span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what happened, what you expected, and any account email or payment details that help us."
            className="w-full resize-y rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-xs leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-zinc-600">
            You'll get a confirmation email and we'll reply in the ticket thread here.
          </p>
          <DashButton type="submit" disabled={sending} loading={sending}>
            {!sending && <Send className="h-3.5 w-3.5" />}
            {sending ? "Submitting…" : "Open ticket"}
          </DashButton>
        </div>
      </form>
    </DashPanel>
  );
}

/* ─── Tab: Ticket Thread View ────────────────────────────────────────────── */

function TicketThread({ ticketId, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } catch {
      setError("Ticket not found or access denied.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const onReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      setReply("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading ticket…</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <AlertCircle className="h-8 w-8 text-red-500/50" />
        <p className="text-sm text-zinc-500">{error || "Ticket not found."}</p>
        <button onClick={onBack} className="text-xs text-zinc-400 hover:text-white underline">Go back</button>
      </div>
    );
  }

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="space-y-4">
      {/* Ticket header */}
      <DashPanel
        bodyClassName="p-4 sm:p-5"
        title={
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back
            </button>
            <span className="text-zinc-700">/</span>
            <span className="text-white">{ticket.subject}</span>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={ticket.status} />
          <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {ticket.topic}
          </span>
          <span className="ml-auto text-[10px] text-zinc-600">
            Opened {formatDate(ticket.created_at)}
          </span>
        </div>
        <p className="mt-1.5 font-mono text-[10px] text-zinc-700">ID: {ticket.id}</p>
      </DashPanel>

      {/* Messages thread */}
      <DashPanel title="Thread" bodyClassName="">
        <div className="divide-y divide-white/[0.04]">
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === "admin";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 p-4 sm:p-5 ${isAdmin ? "bg-[#00f0ff]/[0.025]" : ""}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-black ${
                    isAdmin
                      ? "border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff]"
                      : "border-white/10 bg-white/[0.04] text-zinc-400"
                  }`}
                >
                  {isAdmin ? "S" : (msg.sender_name?.[0] || "U")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[11px] font-bold ${isAdmin ? "text-[#00f0ff]" : "text-white"}`}>
                      {isAdmin ? "Svay Support" : msg.sender_name}
                    </span>
                    <span className="text-[10px] text-zinc-700">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-zinc-400">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        {!isClosed ? (
          <form onSubmit={onReply} className="border-t border-white/[0.06] p-4 sm:p-5 space-y-3">
            {error && <DashAlert variant="error">{error}</DashAlert>}
            <label className="block space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">Your reply</span>
              <textarea
                required
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Add more context, share a screenshot URL, or let us know if the issue is resolved…"
                className="w-full resize-y rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-xs leading-relaxed text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />
            </label>
            <div className="flex justify-end">
              <DashButton type="submit" disabled={sending || !reply.trim()} loading={sending}>
                {!sending && <Send className="h-3.5 w-3.5" />}
                {sending ? "Sending…" : "Send reply"}
              </DashButton>
            </div>
          </form>
        ) : (
          <div className="border-t border-white/[0.06] px-5 py-4">
            <p className="text-center text-[11px] text-zinc-600">
              This ticket is {ticket.status}. Open a new ticket if you need further help.
            </p>
          </div>
        )}
      </DashPanel>
    </div>
  );
}

/* ─── Tab: My Tickets List ───────────────────────────────────────────────── */

function MyTicketsList({ onSelect }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/support/tickets")
      .then((r) => r.json())
      .then((d) => { setTickets(d.tickets || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-4 w-4 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-14">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]">
          <LifeBuoy className="h-5 w-5 text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-500">You haven't opened any tickets yet.</p>
        <p className="text-xs text-zinc-700">Use the "New Ticket" tab to get help.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className="w-full text-left rounded-xl border border-white/[0.07] bg-zinc-950/50 p-4 transition-all hover:border-white/15 hover:bg-zinc-950"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{t.subject}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={t.status} />
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{t.topic}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] text-zinc-600">{timeAgo(t.updated_at)}</p>
              <p className="mt-0.5 font-mono text-[9px] text-zinc-800">{t.id.slice(-8)}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function SupportPage() {
  const { user, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tab, setTab] = useState("tickets"); // "tickets" | "new"
  const [openTicket, setOpenTicket] = useState(searchParams.get("ticket") || null);
  const [openFaq, setOpenFaq] = useState(0);
  const [successTicketId, setSuccessTicketId] = useState(null);

  const handleCreated = (ticketId) => {
    setSuccessTicketId(ticketId);
    setOpenTicket(ticketId);
    setTab("tickets");
    router.replace(`/support?ticket=${ticketId}`, { scroll: false });
  };

  const handleSelectTicket = (id) => {
    setOpenTicket(id);
    router.replace(`/support?ticket=${id}`, { scroll: false });
  };

  const handleBack = () => {
    setOpenTicket(null);
    router.replace("/support", { scroll: false });
  };

  return (
    <DashPage>
      <DashToolbar left={<MetaChip icon={LifeBuoy}>Usually replies in 24h</MetaChip>}>
        <button
          id="open-new-ticket-btn"
          type="button"
          onClick={() => { setOpenTicket(null); setTab("new"); }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/[0.06] px-3 text-[10px] font-bold uppercase tracking-wider text-[#00f0ff] transition-colors hover:border-[#00f0ff]/40 hover:bg-[#00f0ff]/10"
        >
          <Plus className="h-3 w-3" />
          New Ticket
        </button>
      </DashToolbar>

      <DashBody narrow className="space-y-6">
        {successTicketId && !openTicket && (
          <DashAlert variant="success">
            Ticket created! We sent a confirmation to your email. Track it below.
          </DashAlert>
        )}

        {/* Open ticket thread */}
        {openTicket ? (
          <TicketThread ticketId={openTicket} onBack={handleBack} />
        ) : (
          <>
            {/* Quick links */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUICK.map(({ title, desc, href, icon: Icon }) => (
                <Link
                  key={title}
                  href={href}
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 transition-colors hover:border-white/15 hover:bg-zinc-950"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                    <Icon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{title}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl border border-white/[0.07] bg-zinc-950/50 p-1">
              {[
                { id: "tickets", label: "My Tickets", icon: LifeBuoy },
                { id: "new", label: "New Ticket", icon: Plus },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    tab === id
                      ? "bg-white/[0.06] text-white shadow-inner"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === "tickets" ? (
              <DashPanel title="Your tickets" bodyClassName="p-4 sm:p-5">
                {!isSignedIn ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <LifeBuoy className="h-8 w-8 text-zinc-700" />
                    <p className="text-sm text-zinc-500">Sign in to view your support tickets.</p>
                  </div>
                ) : (
                  <MyTicketsList onSelect={handleSelectTicket} />
                )}
              </DashPanel>
            ) : (
              <NewTicketForm user={user} onCreated={handleCreated} />
            )}

            {/* FAQs */}
            <DashPanel title="Common questions" bodyClassName="">
              <div className="divide-y divide-white/[0.05]">
                {FAQS.map((item, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={item.q}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? -1 : i)}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
                      >
                        <span className="text-xs font-bold text-white">{item.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <div className="space-y-2 px-4 pb-4 sm:px-5">
                          <p className="text-[12px] leading-relaxed text-zinc-500">{item.a}</p>
                          {item.href && (
                            <Link
                              href={item.href}
                              className="inline-flex text-[10px] font-bold uppercase tracking-wider text-zinc-300 underline-offset-2 hover:text-white hover:underline"
                            >
                              {item.linkLabel} →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </DashPanel>
          </>
        )}
      </DashBody>
    </DashPage>
  );
}
