"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/user";
import {
  LifeBuoy,
  Mail,
  MessageSquare,
  BookOpen,
  CreditCard,
  ChevronDown,
  ExternalLink,
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
  {
    title: "Billing",
    desc: "Plans, cancel, payment method",
    href: "/billing",
    icon: CreditCard,
  },
  {
    title: "Docs",
    desc: "How to use Svay tools",
    href: "/docs",
    icon: BookOpen,
  },
  {
    title: "Email us",
    desc: "help@svay.space",
    href: "mailto:help@svay.space",
    icon: Mail,
    external: true,
  },
];

export default function SupportPage() {
  const { user, isSignedIn } = useUser();
  const [openFaq, setOpenFaq] = useState(0);
  const [topic, setTopic] = useState("billing");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.name) setName((n) => n || user.name);
    if (user?.email) setEmail((e) => e || user.email);
  }, [user]);

  const topicLabel = useMemo(
    () => TOPICS.find((t) => t.id === topic)?.label || "Other",
    [topic]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSuccess(data.message || "Message sent.");
      setMessage("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashPage>
      <DashToolbar
        left={<MetaChip icon={LifeBuoy}>Usually replies in 24h</MetaChip>}
      >
        <a
          href="mailto:help@svay.space"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-white/15 hover:text-white"
        >
          <Mail className="h-3 w-3" />
          help@svay.space
        </a>
      </DashToolbar>

      <DashBody narrow className="space-y-6">
        <p className="text-sm text-zinc-500">
          Quick answers below — or send us a message. We usually reply within 24 hours on business days.
          {!isSignedIn && (
            <span className="mt-1 block text-xs text-zinc-600">
              Tip: sign in so we can match your account faster.
            </span>
          )}
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK.map(({ title, desc, href, icon: Icon, external }) => {
            const className =
              "flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-zinc-950/50 p-4 transition-colors hover:border-white/15 hover:bg-zinc-950";
            const inner = (
              <>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03]">
                  <Icon className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white flex items-center gap-1">
                    {title}
                    {external && <ExternalLink className="h-3 w-3 text-zinc-600" />}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{desc}</p>
                </div>
              </>
            );
            return external ? (
              <a key={title} href={href} className={className}>
                {inner}
              </a>
            ) : (
              <Link key={title} href={href} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>

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
                      className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
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

        <DashPanel title="Message support" icon={MessageSquare} bodyClassName="p-4 sm:p-5">
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <DashAlert variant="error">{error}</DashAlert>}
            {success && <DashAlert variant="success">{success}</DashAlert>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  Name
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                  Email *
                </span>
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
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                Topic
              </span>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full cursor-pointer rounded-md border border-zinc-800 bg-black px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-600"
              >
                {TOPICS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
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
                Or email{" "}
                <a href="mailto:help@svay.space" className="text-zinc-400 hover:text-white">
                  help@svay.space
                </a>
              </p>
              <DashButton type="submit" disabled={sending} loading={sending}>
                {!sending && <LifeBuoy className="h-3.5 w-3.5" />}
                {sending ? "Sending…" : "Send message"}
              </DashButton>
            </div>
          </form>
        </DashPanel>
      </DashBody>
    </DashPage>
  );
}
