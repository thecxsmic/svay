"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, Check, LifeBuoy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnread(data.unread || 0);
    } catch { /* silent */ }
  }, []);

  // Poll every 60 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = async () => {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      // Optimistically clear badge
      setUnread(0);
      try {
        await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
      } catch { /* silent */ }
    }
  };

  const markOneRead = async (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: 1 } : n));
    try {
      await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    } catch { /* silent */ }
  };

  const unreadList = notifications.filter((n) => !n.read);
  const readList = notifications.filter((n) => n.read);

  return (
    <div className="relative" ref={panelRef}>
      <button
        id="notification-bell-btn"
        type="button"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
        title="Notifications"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell className="h-3.5 w-3.5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00f0ff] px-1 text-[9px] font-black text-black shadow-[0_0_8px_rgba(0,240,255,0.6)]"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-11 z-[200] w-80 overflow-hidden rounded-2xl border border-white/[0.09] bg-zinc-950 shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-[#00f0ff]" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-white">Notifications</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 px-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02]">
                    <Bell className="h-4 w-4 text-zinc-600" />
                  </div>
                  <p className="text-center text-[11px] text-zinc-600">
                    No notifications yet. We'll notify you when support replies.
                  </p>
                </div>
              ) : (
                <div>
                  {unreadList.length > 0 && (
                    <div>
                      <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-600">New</p>
                      {unreadList.map((n) => (
                        <NotifItem key={n.id} n={n} onMarkRead={markOneRead} onClose={() => setOpen(false)} />
                      ))}
                    </div>
                  )}
                  {readList.length > 0 && (
                    <div>
                      <p className="px-4 pt-3 pb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-600">Earlier</p>
                      {readList.map((n) => (
                        <NotifItem key={n.id} n={n} onMarkRead={markOneRead} onClose={() => setOpen(false)} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.06] px-4 py-2.5">
              <Link
                href="/support"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:text-white"
              >
                <LifeBuoy className="h-3 w-3" />
                Open Support Center
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotifItem({ n, onMarkRead, onClose }) {
  const isUnread = !n.read;
  const content = (
    <div
      className={`group relative flex gap-3 px-4 py-3 transition-colors ${isUnread ? "bg-white/[0.025]" : ""} hover:bg-white/[0.03]`}
    >
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00f0ff]/[0.08] border border-[#00f0ff]/[0.15]">
        <LifeBuoy className="h-3.5 w-3.5 text-[#00f0ff]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[12px] font-semibold leading-tight ${isUnread ? "text-white" : "text-zinc-400"}`}>
          {n.title}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-600 line-clamp-2">{n.message}</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-zinc-700">{timeAgo(n.created_at)}</p>
      </div>
      {isUnread && (
        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00f0ff] shadow-[0_0_6px_rgba(0,240,255,0.7)]" />
      )}
    </div>
  );

  if (n.link) {
    return (
      <Link href={n.link} onClick={() => { onMarkRead(n.id); onClose(); }}>
        {content}
      </Link>
    );
  }
  return <div onClick={() => onMarkRead(n.id)}>{content}</div>;
}
