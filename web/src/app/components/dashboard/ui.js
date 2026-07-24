"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { useMobilePageTabs } from "@/contexts/mobilePageTabs";

/* ═══════════════════════════════════════════════════════════════════════════
 * Svay Dashboard UI Kit
 * Shared chrome, loaders, skeletons, empty states — dashboard only.
 * Do not import from landing components.
 * ═══════════════════════════════════════════════════════════════════════════ */

const cn = (...parts) => parts.filter(Boolean).join(" ");

/* ─── Brand orb (same gradient as logo / SvayLoader) ─────────────────────── */

export function BrandOrb({ size = "md", className = "", pulse = false }) {
  const dim =
    size === "xs"
      ? "h-3 w-3"
      : size === "sm"
        ? "h-5 w-5"
        : size === "lg"
          ? "h-12 w-12"
          : size === "xl"
            ? "h-16 w-16"
            : "h-8 w-8";

  return (
    <div
      className={cn(
        dim,
        "shrink-0 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient",
        size === "xs" || size === "sm"
          ? "shadow-[0_0_10px_rgba(0,112,243,0.35)]"
          : "shadow-[0_0_18px_rgba(0,112,243,0.4)]",
        pulse && "dash-orb-pulse",
        className
      )}
      aria-hidden
    />
  );
}

/* ─── Page loading (centered) ───────────────────────────────────────────── */

export function PageLoader({
  label = "Loading…",
  className = "",
  minHeight = "min-h-[55vh]",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 px-6",
        minHeight,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="dash-ring absolute inset-0 rounded-full border border-white/10" />
        <span className="dash-ring-delay absolute inset-1 rounded-full border border-white/5" />
        <BrandOrb size="md" pulse />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
          {label}
        </p>
        <div className="mx-auto h-px w-24 overflow-hidden rounded-full bg-white/5">
          <div className="dash-shimmer h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}

/* ─── Determinate progress (scans / analysis) ───────────────────────────── */

export function ProgressLoader({
  progress = 0,
  step = "Working…",
  className = "",
  minHeight = "min-h-[40vh]",
}) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16",
        minHeight,
        className
      )}
      role="status"
      aria-live="polite"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="relative mb-10 flex h-28 w-28 items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.45], opacity: [0.45, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border border-white/25"
        />
        <motion.div
          animate={{ scale: [1, 1.25], opacity: [0.3, 0] }}
          transition={{ duration: 2, delay: 0.45, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-2 rounded-full border border-white/15"
        />
        <BrandOrb size="lg" pulse />
      </div>

      <div className="w-full max-w-xs space-y-3 text-center">
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          <span className="truncate text-left text-zinc-400">{step || "Working…"}</span>
          <span className="shrink-0 tabular-nums text-zinc-500">{pct}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-900">
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="h-full rounded-full bg-gradient-to-r from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Indeterminate thin bar (library refresh style) ────────────────────── */

export function IndeterminateLoader({
  label = "Loading…",
  className = "",
  minHeight = "min-h-[40vh]",
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-20",
        minHeight,
        className
      )}
      role="status"
      aria-label={label}
    >
      <div className="mb-6">
        <BrandOrb size="md" pulse />
      </div>
      <div className="w-64 max-w-full space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          <span>{label}</span>
          <BrandOrb size="xs" />
        </div>
        <div className="h-px w-full overflow-hidden bg-zinc-900">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.35, ease: "linear" }}
            className="h-full w-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Floating status toast (bottom-right) ──────────────────────────────── */

export function LoadingToast({ show, label = "Working…", progress }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="fixed bottom-6 right-6 z-[100] sm:bottom-8 sm:right-8"
        >
          <div className="flex min-w-[148px] items-center gap-3 rounded-full border border-white/10 bg-black/90 px-4 py-2.5 shadow-2xl backdrop-blur-md">
            <BrandOrb size="xs" pulse />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {label}
            </span>
            {typeof progress === "number" && (
              <span className="text-[10px] font-bold tabular-nums text-zinc-600">
                {Math.round(progress)}%
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Inline spinner for buttons ────────────────────────────────────────── */

export function ButtonSpinner({ className = "h-3.5 w-3.5" }) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin",
        className
      )}
      aria-hidden
    />
  );
}

/* ─── Skeleton primitives ───────────────────────────────────────────────── */

export function Skeleton({ className = "" }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/[0.04]",
        className
      )}
    >
      <div className="dash-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

export function SkeletonCard({ lines = 3, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5 sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-2.5", i === lines - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, className = "" }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStatRow({ count = 4, className = "" }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-5"
        >
          <Skeleton className="mb-3 h-2.5 w-16" />
          <Skeleton className="mb-2 h-7 w-24" />
          <Skeleton className="h-2 w-20" />
        </div>
      ))}
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  className = "",
  compact = false,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-16" : "py-20 sm:py-28",
        className
      )}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-inner sm:h-20 sm:w-20 sm:rounded-full">
        {Icon ? (
          <Icon className="h-7 w-7 text-zinc-500 sm:h-9 sm:w-9" strokeWidth={1.5} />
        ) : (
          <BrandOrb size="md" />
        )}
      </div>
      {title && (
        <h2 className="font-display text-xl tracking-tight text-white uppercase sm:text-2xl">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
      {(action || actionLabel) && (
        <div className="mt-8">
          {action || (
            <span className="inline-flex items-center rounded-full bg-white px-8 py-2.5 text-sm font-semibold text-black">
              {actionLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Alerts ────────────────────────────────────────────────────────────── */

export function DashAlert({ variant = "error", children, className = "" }) {
  const styles = {
    error: "border-red-500/20 bg-red-500/5 text-red-400",
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    warning: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
    info: "border-white/10 bg-white/[0.03] text-zinc-400",
  };
  const Icon =
    variant === "success"
      ? CheckCircle2
      : variant === "info"
        ? Info
        : AlertTriangle;

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs leading-relaxed",
        styles[variant] || styles.error,
        className
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-90" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ─── Page chrome (matches Trend Radar shell) ───────────────────────────── */

export function DashPage({ children, className = "" }) {
  return (
    <div
      className={cn(
        // mx-auto keeps the column centered on iPhone (safe-area / overflow drift)
        "mx-auto min-h-full w-full min-w-0 max-w-full overflow-x-hidden bg-black text-white font-sans selection:bg-white selection:text-black",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Sticky page toolbar.
 *
 * Mobile (app-like):
 *  - Top row (optional): meta/details + action buttons only
 *  - Page section tabs sit in a secondary bar just above the bottom nav
 *    (thumb zone — not a top section picker)
 * Desktop: meta chips + action buttons + full tab row
 */
export function DashToolbar({
  left,
  mobileLeft,
  children,
  tabs,
  /** Preferred: structured tabs for mobile bottom bar + desktop row */
  tabItems,
  tabValue,
  onTabChange,
  className = "",
  maxWidth = "max-w-7xl",
}) {
  const hasStructuredTabs =
    Array.isArray(tabItems) && tabItems.length > 0 && typeof onTabChange === "function";

  const desktopTabs = hasStructuredTabs ? (
    <DashTabs items={tabItems} value={tabValue} onChange={onTabChange} />
  ) : (
    tabs
  );

  // Mobile top chrome only when there is something to show besides tabs
  const showMobileTop = Boolean(children || mobileLeft);

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-40 mx-auto w-full min-w-0 max-w-full border-b border-white/[0.06] bg-black/85 backdrop-blur-xl",
          // Hide empty sticky shell on phone when only bottom tabs exist
          !showMobileTop && "max-md:hidden",
          className
        )}
      >
        {/* ── Mobile / phone shell: actions + meta (tabs live at bottom) ─ */}
        {showMobileTop && (
          <div
            className={cn(
              // Match DashBody mobile gutter (px-4); mx-auto centers on iPhone
              "mx-auto flex h-12 w-full min-w-0 max-w-full items-center gap-2 px-4 md:hidden",
              maxWidth
            )}
          >
            {hasStructuredTabs ? (
              mobileLeft ? (
                <MobileMetaTrigger meta={mobileLeft} />
              ) : (
                <div className="min-w-0 flex-1" />
              )
            ) : (
              <div className="min-w-0 flex-1">{mobileLeft}</div>
            )}
            {children && (
              <div className="flex shrink-0 items-center gap-1.5">{children}</div>
            )}
          </div>
        )}

        {/* ── Desktop (≥ md, matches LayoutContent sidebar shell) ───── */}
        <div className="hidden md:block">
          <div
            className={cn(
              "mx-auto flex items-center justify-between gap-3 px-6 py-3",
              maxWidth
            )}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">{left}</div>
            {children && (
              <div className="flex shrink-0 items-center gap-2">{children}</div>
            )}
          </div>
          {desktopTabs && (
            <div className="dash-tabs-desktop border-t border-white/[0.04]">
              {desktopTabs}
            </div>
          )}
        </div>
      </div>

      {/* Mobile page tabs — secondary bar just above primary bottom nav */}
      {hasStructuredTabs && (
        <MobileBottomTabs
          items={tabItems}
          value={tabValue}
          onChange={onTabChange}
        />
      )}
    </>
  );
}

function usePortalReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

function MobileSheetPortal({ children }) {
  const ready = usePortalReady();
  if (!ready || typeof document === "undefined") return null;
  // Portal to body so overflow/transform on app shell cannot clip the sheet
  return createPortal(children, document.body);
}

/**
 * Registers page section tabs with MobileAppShell (secondary bar above primary nav).
 * Does not render UI itself — the shell owns hit targets so taps always work.
 */
export function MobileBottomTabs({ items = [], value, onChange }) {
  const ctx = useMobilePageTabs();
  const setPageTabs = ctx?.setPageTabs;
  const clearPageTabs = ctx?.clearPageTabs;
  const itemsKey = Array.isArray(items)
    ? items.map((t) => `${t.id}:${t.label}:${t.count ?? ""}`).join("|")
    : "";

  // Keep shell config in sync while mounted
  useEffect(() => {
    if (!setPageTabs) return;
    if (!Array.isArray(items) || items.length === 0 || typeof onChange !== "function") {
      clearPageTabs?.();
      return;
    }
    setPageTabs({ items, value, onChange });
  }, [setPageTabs, clearPageTabs, items, itemsKey, value, onChange]);

  // Clear only on unmount so tab switches don't flash the bar away
  useEffect(() => {
    return () => clearPageTabs?.();
  }, [clearPageTabs]);

  return null;
}

/** Compact details trigger for mobile top row (channel / scan meta). */
function MobileMetaTrigger({ meta }) {
  const [metaOpen, setMetaOpen] = useState(false);

  useEffect(() => {
    if (!metaOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [metaOpen]);

  if (!meta) return <div className="min-w-0 flex-1" />;

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <button
          type="button"
          onClick={() => setMetaOpen(true)}
          className="flex h-9 min-w-0 max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 text-left text-zinc-400 active:bg-white/[0.08]"
          aria-label="Details"
        >
          <Info className="h-4 w-4 shrink-0" />
          <span className="truncate text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Details
          </span>
        </button>
      </div>

      {metaOpen && (
        <MobileSheetPortal>
          <div className="fixed inset-0 z-[200] md:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setMetaOpen(false)}
            />
            <div className="mobile-more-sheet absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-[1.5rem] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" />
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-sm uppercase tracking-tight text-white">
                  Details
                </p>
                <button
                  type="button"
                  onClick={() => setMetaOpen(false)}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300"
                >
                  Done
                </button>
              </div>
              <div className="flex flex-col gap-2">{meta}</div>
            </div>
          </div>
        </MobileSheetPortal>
      )}
    </>
  );
}

/**
 * @deprecated Prefer MobileBottomTabs via DashToolbar tabItems.
 * Kept so any external import does not break; renders bottom tabs.
 */
export function MobileSectionNav({ items = [], value, onChange, meta }) {
  return (
    <>
      {meta ? <MobileMetaTrigger meta={meta} /> : <div className="min-w-0 flex-1" />}
      <MobileBottomTabs items={items} value={value} onChange={onChange} />
    </>
  );
}

/** Desktop (and optional) pill tabs */
export function DashTabs({ items = [], value, onChange, className = "" }) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 pb-2 no-scrollbar",
        className
      )}
    >
      {items.map((t) => {
        const active = value === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange?.(t.id)}
            title={t.label}
            aria-label={t.label}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
              active
                ? "bg-white/[0.1] text-white"
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            <span>{t.label}</span>
            {typeof t.count === "number" && (
              <span className="tabular-nums text-zinc-600">{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * @deprecated Prefer mobileMeta content via DashToolbar mobileLeft + structured tabItems.
 * Kept for simple pages that only need a details sheet trigger.
 */
export function MobileMetaSheet({
  open,
  onOpenChange,
  title = "Details",
  triggerLabel = "Info",
  triggerIcon: TriggerIcon,
  children,
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange?.(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-2.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:hidden"
      >
        {TriggerIcon ? (
          <TriggerIcon className="h-3.5 w-3.5 shrink-0" />
        ) : null}
        <span className="max-w-[7rem] truncate">{triggerLabel}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] sm:hidden">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
            onClick={() => onOpenChange?.(false)}
          />
          <div className="mobile-more-sheet absolute inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto rounded-t-2xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm uppercase tracking-tight text-white">
                {title}
              </p>
              <button
                type="button"
                onClick={() => onOpenChange?.(false)}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400"
              >
                Done
              </button>
            </div>
            <div className="flex flex-col gap-2">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}

/** Small meta pill (scan age, channel, status) */
export function MetaChip({ icon: Icon, children, className = "", onClick, as: Tag = "span" }) {
  const Comp = onClick ? "button" : Tag;
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500",
        onClick && "cursor-pointer transition-colors hover:border-white/15 hover:text-zinc-300",
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      <span className="truncate">{children}</span>
    </Comp>
  );
}

/**
 * Legacy page header with icon+title — prefer DashToolbar under shell.
 * Kept for public/care pages that may not use the app top nav.
 */
export function DashHeader({
  icon: Icon,
  title,
  subtitle,
  children,
  className = "",
  maxWidth = "max-w-7xl",
  hideTitle = false,
}) {
  if (hideTitle) {
    return (
      <DashToolbar className={className} maxWidth={maxWidth} left={subtitle ? <MetaChip>{subtitle}</MetaChip> : null}>
        {children}
      </DashToolbar>
    );
  }

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:px-6",
          maxWidth
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              <Icon className="h-4 w-4 text-black" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-display text-sm uppercase tracking-tight sm:text-[15px]">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden truncate text-[10px] font-bold uppercase tracking-widest text-zinc-600 sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">{children}</div>
        )}
      </div>
    </nav>
  );
}

export function DashBody({
  children,
  className = "",
  maxWidth = "max-w-7xl",
  narrow = false,
}) {
  // Desktop caps only — on phone we always use full width + px-4 gutters
  // so content never shrinks/centers/shifts left under the mobile shell.
  const desktopMax = narrow
    ? "md:max-w-3xl"
    : maxWidth === "max-w-5xl"
      ? "md:max-w-5xl"
      : maxWidth === "max-w-6xl"
        ? "md:max-w-6xl"
        : maxWidth === "max-w-4xl"
          ? "md:max-w-4xl"
          : "md:max-w-7xl";

  return (
    <div
      className={cn(
        // mx-auto is required on iPhone so the column stays centered
        "mx-auto w-full min-w-0 max-w-full px-4 py-6 sm:px-6 sm:py-8",
        desktopMax,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DashKpi({ label, value, icon: Icon, tone = "text-zinc-300", sub, className = "" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4 sm:p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-600">
            {label}
          </p>
          <p className="mt-1.5 truncate font-display text-xl tracking-tight text-white sm:text-2xl">
            {value ?? "—"}
          </p>
          {sub && (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              {sub}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/40">
            <Icon className={cn("h-3.5 w-3.5", tone)} />
          </div>
        )}
      </div>
    </div>
  );
}

export function DashPanel({ title, icon: Icon, action, children, className = "", bodyClassName = "" }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/70",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" />}
            {title && (
              <h3 className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {title}
              </h3>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function DashCard({ children, className = "", padded = true, hover = false }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-zinc-950/50",
        padded && "p-5 sm:p-6",
        hover &&
          "transition-colors hover:border-white/15 hover:bg-zinc-950",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DashCardHeader({ children, className = "" }) {
  return (
    <div
      className={cn(
        "border-b border-white/[0.05] px-4 py-3 sm:px-5",
        className
      )}
    >
      {typeof children === "string" ? (
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          {children}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

export function DashSectionLabel({ children, icon: Icon, className = "" }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Icon && <Icon className="h-3.5 w-3.5 text-zinc-500" />}
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
        {children}
      </p>
    </div>
  );
}

export function DashChip({ active, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
        active
          ? "bg-white text-black"
          : "border border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ─── Buttons ───────────────────────────────────────────────────────────── */

export function DashButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  type = "button",
  ...props
}) {
  // Match mobile liquid-glass chrome: always fully rounded pills
  const sizes = {
    sm: "h-9 min-w-9 px-3 text-[10px] gap-1.5 rounded-full",
    md: "h-9 px-3.5 text-[10px] gap-2 rounded-full sm:px-4",
    lg: "h-11 px-5 text-[11px] gap-2 rounded-full",
  };
  const variants = {
    primary:
      "bg-white text-black hover:bg-zinc-200 disabled:hover:bg-white",
    secondary:
      "border border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
    ghost:
      "border border-transparent text-zinc-500 hover:bg-white/5 hover:text-white",
    danger:
      "border border-white/10 text-zinc-500 hover:border-red-500/30 hover:text-red-400",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        sizes[size] || sizes.md,
        variants[variant] || variants.primary,
        className
      )}
      {...props}
    >
      {loading && <ButtonSpinner className="h-3 w-3" />}
      {children}
    </button>
  );
}

/* ─── Fade-in content wrapper ───────────────────────────────────────────── */

export function FadeIn({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
