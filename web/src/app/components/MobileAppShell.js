'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  Search,
  Zap,
  Users,
  Trophy,
  BookOpen,
  BarChart3,
  Wrench,
  CreditCard,
  LifeBuoy,
  HelpCircle,
  Plus,
  Radio,
  X,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** Icon-only primary tabs (thumb zone) */
const PRIMARY_TABS = [
  { name: 'Search', href: '/', icon: Search },
  { name: 'Trends', href: '/radar', icon: Zap },
  { name: 'Channels', href: '/channels', icon: Users },
  { name: 'Rivals', href: '/competitors', icon: Trophy },
];

const MORE_LINKS = [
  { name: 'Analytics', href: '/analytics', icon: BarChart3, group: 'Grow' },
  { name: 'Library', href: '/library', icon: BookOpen, group: 'Grow' },
  { name: 'Tools', href: '/tools', icon: Wrench, group: 'Grow' },
  { name: 'Billing', href: '/billing', icon: CreditCard, group: 'Account' },
  { name: 'Support', href: '/support', icon: LifeBuoy, group: 'Account' },
  { name: 'Docs', href: '/docs', icon: HelpCircle, group: 'Account' },
];

function isTabActive(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMoreActive(pathname) {
  return MORE_LINKS.some((l) => isTabActive(pathname, l.href));
}

/**
 * Phone shell: no top app bar — floating icon-only liquid-glass bottom nav.
 * Desktop is handled in LayoutContent.
 */
export default function MobileAppShell({
  children,
  userChannel,
  isDemo,
  isPromo,
  promoExpiryStr,
  onOpenNotes,
  onOpenSetup,
  onOpenRemove,
  onToggleDemo,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = isMoreActive(pathname);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreOpen]);

  return (
    <div className="mobile-app-shell flex h-full flex-col overflow-hidden bg-black text-white md:hidden">
      {/* Safe area only — no chrome top bar */}
      <div
        className="shrink-0"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
        aria-hidden
      />

      <main className="mobile-app-main relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="min-h-full pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
      </main>

      {/* Icon-only floating bottom nav */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-[max(0.4rem,env(safe-area-inset-bottom))] md:hidden">
        <nav
          className="pointer-events-auto relative flex w-full max-w-[22rem] items-center justify-around gap-0.5 rounded-full border border-white/10 bg-black/50 px-1.5 py-1.5 shadow-lg backdrop-blur-md"
          aria-label="Primary"
        >
          {PRIMARY_TABS.map((tab) => (
            <NavIcon
              key={tab.href}
              href={tab.href}
              icon={tab.icon}
              label={tab.name}
              active={isTabActive(pathname, tab.href)}
            />
          ))}

          {/* Svay icon = menu opener (replaces ⋯) */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="relative flex h-11 w-11 items-center justify-center"
            aria-label="Open menu"
            title="Menu"
          >
            {(moreOpen || moreActive) && (
              <span className="absolute inset-1 rounded-full bg-white/10" />
            )}
            <span
              className={`relative h-7 w-7 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_12px_rgba(0,112,243,0.35)] ring-1 ${
                moreOpen || moreActive ? 'ring-white/40' : 'ring-white/15'
              }`}
            />
          </button>
        </nav>
      </div>

      {/* More sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="mobile-more-sheet fixed inset-x-0 bottom-0 z-[201] max-h-[min(88vh,640px)] overflow-hidden rounded-t-[1.75rem] md:hidden"
            >
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>

              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-zinc-500" />
                  <p className="font-display text-sm uppercase tracking-tight text-white">
                    Menu
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[calc(min(88vh,640px)-5rem)] overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenNotes?.();
                    }}
                    className="flex items-center gap-2.5 rounded-2xl border border-[#00f0ff]/20 bg-[#00f0ff]/[0.08] px-3.5 py-3 text-left"
                  >
                    <Plus className="h-4 w-4 text-[#00f0ff]" strokeWidth={2.5} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                      New note
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      if (userChannel) onOpenRemove?.();
                      else onOpenSetup?.();
                    }}
                    className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-left"
                  >
                    <Radio className="h-4 w-4 text-zinc-400" />
                    <span className="truncate text-[11px] font-bold uppercase tracking-wider text-white">
                      {userChannel ? 'Channel' : 'Connect'}
                    </span>
                  </button>
                </div>

                {['Grow', 'Account'].map((group) => (
                  <div key={group} className="mb-4">
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                      {group}
                    </p>
                    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                      {MORE_LINKS.filter((l) => l.group === group).map((item, idx, arr) => {
                        const active = isTabActive(pathname, item.href);
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => {
                              setMoreOpen(false);
                              router.push(item.href);
                            }}
                            className={`flex w-full items-center gap-3 px-3.5 py-3.5 text-left active:bg-white/[0.06] ${
                              idx < arr.length - 1 ? 'border-b border-white/[0.05]' : ''
                            } ${active ? 'bg-white/[0.05]' : ''}`}
                          >
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                active
                                  ? 'bg-[#00f0ff]/15 text-[#00f0ff]'
                                  : 'bg-white/[0.05] text-zinc-400'
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span
                              className={`flex-1 text-sm font-semibold ${
                                active ? 'text-white' : 'text-zinc-200'
                              }`}
                            >
                              {item.name}
                            </span>
                            <ChevronRight className="h-4 w-4 text-zinc-600" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="mb-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                  {isDemo ? (
                    <button
                      type="button"
                      onClick={onToggleDemo}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-yellow-500/20" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">Demo account</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-500">
                          Tap to exit
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <UserButton
                        appearance={{
                          elements: {
                            userButtonAvatarBox: 'w-10 h-10 border border-white/10',
                          },
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">
                          {isPromo ? 'Promo' : 'Pro'} account
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {isPromo && promoExpiryStr
                            ? `Expires ${promoExpiryStr}`
                            : 'Active'}
                        </p>
                      </div>
                      <Link
                        href="/billing"
                        onClick={() => setMoreOpen(false)}
                        className="rounded-xl border border-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400"
                      >
                        Plan
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavIcon({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="relative flex h-11 w-11 items-center justify-center"
    >
      {active && (
        <motion.span
          layoutId="mobile-icon-glow"
          className="absolute inset-1 rounded-full bg-white/[0.12]"
          transition={{ type: 'spring', stiffness: 400, damping: 34 }}
        />
      )}
      <Icon
        className={`relative h-5 w-5 transition-colors ${
          active ? 'text-white' : 'text-zinc-500'
        }`}
        strokeWidth={active ? 2.5 : 2}
      />
    </Link>
  );
}
