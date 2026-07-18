"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@/contexts/user";
import {
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquare,
  BookOpen,
  CreditCard,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

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
    a: "Open Billing from the sidebar (or the Pro badge). You can cancel at period end, resume a pending cancel, or manage your payment method in the Dodo portal.",
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
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Sticky header — dashboard style */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <LifeBuoy className="h-5 w-5 text-black" />
            </div>
            <div>
              <h1 className="font-display text-lg uppercase tracking-tight">Support</h1>
              <p className="hidden text-[10px] font-bold uppercase tracking-widest text-zinc-600 sm:block">
                Customer care
              </p>
            </div>
          </div>
          <a
            href="mailto:help@svay.space"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
          >
            <Mail className="h-3 w-3" />
            help@svay.space
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <p className="text-sm text-zinc-500">
          Quick answers below — or send us a message. We usually reply within 24 hours on business days.
          {!isSignedIn && (
            <span className="block mt-1 text-xs text-zinc-600">
              Tip: sign in so we can match your account faster.
            </span>
          )}
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {QUICK.map(({ title, desc, href, icon: Icon, external }) => {
            const className =
              "flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-950";
            const inner = (
              <>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5">
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

        {/* FAQ */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Common questions
            </p>
          </div>
          <div className="divide-y divide-zinc-800/80">
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
        </section>

        {/* Contact form */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/50">
          <div className="border-b border-zinc-800/80 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Message support
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 p-4 sm:p-5">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>{success}</p>
              </div>
            )}

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
                placeholder="Tell us what happened, what you expected, and any account email or payment details that help."
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
              <button
                type="submit"
                disabled={sending}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <LifeBuoy className="h-3.5 w-3.5" />
                    Send message
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
