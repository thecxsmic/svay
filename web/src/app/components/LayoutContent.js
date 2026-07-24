'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from "@clerk/nextjs";
import { Plus, Search, Zap, Users, Trophy, BookOpen, BarChart3, Radio, HelpCircle, SlidersHorizontal, Trash2, CreditCard, LifeBuoy, Wrench, ChevronRight, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChannel } from '@/contexts/channel';
import { useUser } from '@/contexts/user';
import PinnedChannels from "./PinnedChannels";
import ResearchNotesModal from "./ResearchNotesModal";
import SetupUserChannelModal from "./SetupUserChannelModal";
import RemoveUserChannelModal from "./RemoveUserChannelModal";
import MobileAppShell from "./MobileAppShell";
import { MobilePageTabsProvider } from "@/contexts/mobilePageTabs";

const navItems = [
  { name: 'Search', href: '/', icon: Search },
  { name: 'Trends', href: '/radar', icon: Zap },
  { name: 'Channels', href: '/channels', icon: Users },
  { name: 'Competitors', href: '/competitors', icon: Trophy },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Library', href: '/library', icon: BookOpen },
  { name: 'Tools', href: '/tools', icon: Wrench },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Affiliate', href: '/affiliate', icon: Megaphone },
  { name: 'Support', href: '/support', icon: LifeBuoy },
  { name: 'Docs', href: '/docs', icon: HelpCircle },
];

function resolvePageMeta(pathname) {
  if (pathname === '/') return { title: 'Search', section: 'Intelligence' };
  if (pathname.startsWith('/radar')) return { title: 'Trend Radar', section: 'Intelligence' };
  if (pathname.startsWith('/channels')) return { title: 'Channels', section: 'Intelligence' };
  if (pathname.startsWith('/competitors')) return { title: 'Competitors', section: 'Intelligence' };
  if (pathname.startsWith('/analytics')) return { title: 'Analytics', section: 'Growth' };
  if (pathname.startsWith('/library')) return { title: 'Library', section: 'Research' };
  if (pathname.startsWith('/tools')) return { title: 'Tools', section: 'Utilities' };
  if (pathname.startsWith('/billing')) return { title: 'Billing', section: 'Account' };
  if (pathname.startsWith('/affiliate')) return { title: 'Affiliate', section: 'Account' };
  if (pathname.startsWith('/support')) return { title: 'Support', section: 'Account' };
  if (pathname.startsWith('/docs')) return { title: 'Docs', section: 'Help' };
  if (pathname.startsWith('/admin')) return { title: 'Admin', section: 'Internal' };
  return { title: 'Dashboard', section: 'Svay' };
}

export default function LayoutContent({ children, subscription }) {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const { channels, userChannel, selectChannel, loading, refreshChannels } = useChannel();
  const { user } = useUser();
  const [isDemo, setIsDemo] = useState(false);
  const pathname = usePathname();

  const isPromo = subscription?.subscriptionId?.startsWith("promo_") || 
                  subscription?.planId?.startsWith("promo_") ||
                  subscription?.subscriptionId?.startsWith("admin_grant") || 
                  subscription?.planId?.startsWith("admin_grant");

  const promoExpiryStr = subscription?.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()
    : "";

  useEffect(() => {
    setIsDemo(document.cookie.includes("demo_mode=true"));
  }, []);

  const toggleDemoMode = () => {
    document.cookie = "demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.reload();
  };

  // Automatically prompt to connect channel if none is connected.
  useEffect(() => {
    const isDemoCookie = document.cookie.includes("demo_mode=true");
    const isCarePage =
      pathname.startsWith("/support") ||
      pathname.startsWith("/billing") ||
      pathname.startsWith("/affiliate");
    if (!loading && !isDemoCookie && !userChannel && !isCarePage) {
      setIsSetupModalOpen(true);
    }
  }, [loading, userChannel, pathname]);

  const selected = channels.data.find((c) => c.id === channels.selectedId);

  const sharedModals = (
    <>
      <ResearchNotesModal 
        isOpen={isNotesModalOpen} 
        onClose={() => setIsNotesModalOpen(false)} 
      />

      {isSetupModalOpen && (
        <SetupUserChannelModal 
          onChannelSet={() => {
            setIsSetupModalOpen(false);
            refreshChannels();
          }} 
        />
      )}

      {isRemoveModalOpen && (
        <RemoveUserChannelModal 
          onClose={() => setIsRemoveModalOpen(false)}
          onChannelRemoved={() => {
            setIsRemoveModalOpen(false);
            refreshChannels();
          }}
          channelTitle={userChannel?.title}
        />
      )}
    </>
  );

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_15px_rgba(0,112,243,0.3)] group-hover:shadow-[0_0_20px_rgba(0,112,243,0.5)] transition-shadow" />
          <span className="font-logo font-black text-xl tracking-tight text-white uppercase">Svay</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 mt-2 overflow-y-auto no-scrollbar">
        <div className="pb-2 px-3">
          <p className="font-display text-[10px] font-bold text-accents-4 uppercase tracking-widest">Intelligence</p>
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link 
              key={item.name}
              href={item.href} 
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all relative group ${
                isActive 
                  ? 'text-white bg-white/[0.08]' 
                  : 'text-accents-4 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav-indicator"
                  className="absolute left-0 w-[2px] h-4 bg-white rounded-full"
                />
              )}
              <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-accents-4 group-hover:text-white'}`} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-8 pb-2 px-3">
          <p className="font-display text-[10px] font-bold text-accents-4 uppercase tracking-wider">My Channel</p>
        </div>
        
        {userChannel ? (
          <div className="px-2">
            <div className="relative group/channel">
              <button 
                onClick={() => selectChannel(userChannel.id)}
                className={`w-full flex items-center gap-3 pl-3 pr-8 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all text-left relative ${
                  channels.selectedId === userChannel.id 
                    ? 'text-white bg-white/[0.08]' 
                    : 'text-accents-4 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden border border-white/10 shrink-0">
                  <img src={userChannel.thumbnail} className="w-full h-full object-cover" alt="" />
                </div>
                <span className="truncate flex-1">{userChannel.title}</span>
                {channels.selectedId === userChannel.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-geist-success shadow-[0_0_8px_rgba(0,112,243,0.5)] shrink-0"></div>
                )}
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRemoveModalOpen(true);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-accents-4 hover:text-red-500 rounded-md hover:bg-white/5 opacity-100 md:opacity-0 md:group-hover/channel:opacity-100 transition-all cursor-pointer z-10"
                title="Disconnect Channel"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-2">
            <button 
              onClick={() => setIsSetupModalOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider text-accents-3 hover:text-white hover:bg-white/5 transition-all group text-left"
            >
              <Radio className="w-4 h-4" />
              Connect Channel
            </button>
          </div>
        )}

        <div className="pt-8 pb-2 px-3">
          <p className="font-display text-[10px] font-bold text-accents-4 uppercase tracking-wider">Research</p>
        </div>
        
        <button 
          onClick={() => setIsNotesModalOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider text-geist-success hover:bg-geist-success/5 transition-all group text-left"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" strokeWidth={3} />
          New Note
        </button>

        <div className="pt-8 pb-4 px-3">
          <p className="font-display text-[10px] font-bold text-accents-4 uppercase tracking-wider">Pinned</p>
        </div>
        <PinnedChannels />

        {process.env.NODE_ENV === 'development' && (
          <>
            <div className="pt-8 pb-2 px-3">
              <p className="font-display text-[10px] font-bold text-red-500 uppercase tracking-wider">Developer</p>
            </div>
            <a 
              href="/api/env" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all group"
            >
              <SlidersHorizontal className="w-4 h-4 text-red-500 group-hover:rotate-45 transition-transform" />
              Env Console
            </a>
          </>
        )}
      </nav>
      <div className="p-4 border-t border-accents-2 mt-auto space-y-2">
        {isDemo ? (
          <div 
            onClick={toggleDemoMode}
            className="w-full bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 flex items-center gap-3 hover:bg-yellow-500/10 transition-colors cursor-pointer"
            title="Click to Exit Demo Mode"
          >
            <div className="relative shrink-0">
              <img src={user?.imageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"} className="w-8 h-8 rounded-full border border-yellow-500/30 object-cover" alt="" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-yellow-500 border border-black animate-pulse"></span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-white uppercase tracking-tight truncate">{user?.name || "Demo Account"}</p>
              <p className="text-[8px] text-yellow-500 font-bold uppercase tracking-widest">Exit Demo Mode</p>
            </div>
          </div>
        ) : (
          <>
            <div 
              onClick={(e) => {
                const button = e.currentTarget.querySelector('button');
                if (button && !button.contains(e.target)) {
                  button.click();
                }
              }}
              className="w-full bg-accents-1 border border-accents-2 rounded-lg p-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
                <UserButton appearance={{ 
                  elements: { 
                    userButtonAvatarBox: "w-8 h-8 border border-white/10" 
                  } 
                }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-white uppercase tracking-tight truncate">
                    {isPromo ? "Promo Account" : "Pro Account"}
                  </p>
                  <p className={`text-[8px] font-bold uppercase tracking-widest ${isPromo ? 'text-[#00f0ff]' : 'text-accents-4'}`}>
                    {isPromo && promoExpiryStr ? `Expires: ${promoExpiryStr}` : "Status: Active"}
                  </p>
                </div>
            </div>
            <Link
              href="/billing"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-2 text-[9px] font-bold uppercase tracking-wider text-accents-4 transition-colors hover:border-white/15 hover:text-white"
            >
              <CreditCard className="h-3 w-3" />
              Manage billing
            </Link>
          </>
        )}
      </div>
    </>
  );

  const page = resolvePageMeta(pathname);

  return (
    <div className="flex h-full w-full min-w-0 max-w-full overflow-hidden bg-black text-white font-sans selection:bg-geist-success selection:text-white">
      {sharedModals}

      {/* ═══ MOBILE APP SHELL (phones / Android) ═══ */}
      <MobilePageTabsProvider>
        <MobileAppShell
          userChannel={userChannel}
          isDemo={isDemo}
          isPromo={isPromo}
          promoExpiryStr={promoExpiryStr}
          onOpenNotes={() => setIsNotesModalOpen(true)}
          onOpenSetup={() => setIsSetupModalOpen(true)}
          onOpenRemove={() => setIsRemoveModalOpen(true)}
          onToggleDemo={toggleDemoMode}
        >
          <div className="mx-auto w-full min-w-0 max-w-full animate-[dash-page-in_0.28s_ease-out]">
            {children}
          </div>
        </MobileAppShell>
      </MobilePageTabsProvider>

      {/* ═══ DESKTOP (≥ md) ═══ */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-accents-2 bg-accents-1 md:flex">
        <SidebarContent />
      </aside>

      <div className="hidden min-w-0 flex-1 flex-col overflow-hidden bg-black md:flex">
        <header className="relative z-50 shrink-0 border-b border-white/[0.06] bg-black/75 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />

          <div className="flex h-[3.75rem] items-center justify-between gap-3 px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                {page.section}
              </span>
              <ChevronRight className="h-3 w-3 shrink-0 text-zinc-700" />
              <h2 className="truncate font-display text-[15px] uppercase tracking-tight text-white">
                {page.title}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/90">
                  Live
                </span>
              </span>
            </div>

            <div className="flex min-w-0 flex-1 justify-center px-4">
              {selected || userChannel ? (
                <button
                  type="button"
                  onClick={() => {
                    const ch = selected || userChannel;
                    if (ch?.id) selectChannel(ch.id);
                  }}
                  className="group flex max-w-xs items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3 transition-all hover:border-white/15 hover:bg-white/[0.06]"
                  title="Active research channel"
                >
                  <div className="h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-zinc-900">
                    {(selected || userChannel)?.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(selected || userChannel).thumbnail}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Radio className="h-3 w-3 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-[11px] font-bold text-white">
                      {(selected || userChannel)?.title || "Channel"}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 group-hover:text-zinc-500">
                      Active channel
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSetupModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/10 bg-white/[0.02] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Connect channel
                </button>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isDemo && (
                <button
                  type="button"
                  onClick={toggleDemoMode}
                  className="flex items-center gap-1.5 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-2.5 py-1.5 text-yellow-400 transition-colors hover:bg-yellow-500/15"
                  title="Exit demo mode"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
                  <span className="text-[10px] font-bold uppercase tracking-tight">
                    Demo
                  </span>
                </button>
              )}

              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                title="Search"
              >
                <Search className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/support"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
                title="Support"
              >
                <LifeBuoy className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/billing"
                className="group relative flex h-9 items-center gap-1.5 overflow-hidden rounded-xl border border-[#00f0ff]/20 bg-gradient-to-r from-[#00f0ff]/10 to-[#0070f3]/10 px-3 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:border-[#00f0ff]/40 hover:from-[#00f0ff]/15 hover:to-[#0070f3]/15"
                title="Manage subscription"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <Zap className="relative h-3 w-3 text-[#00f0ff]" fill="currentColor" />
                <span className="relative">
                  {isPromo ? "Promo" : "Pro"}
                </span>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto scroll-smooth custom-scrollbar bg-black">
          <div className="mx-auto flex min-h-full max-w-[1600px] flex-col">
            <div className="flex-1 animate-[dash-page-in_0.28s_ease-out]">
              {children}
            </div>
            
            <footer className="mt-auto flex min-h-[88px] items-center border-t border-accents-2 px-8">
              <div className="flex w-full flex-col items-center justify-between gap-6 md:flex-row">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
                      <div className="ml-0.5 h-0 w-0 border-b-[2.5px] border-l-[4px] border-t-[2.5px] border-b-transparent border-l-white/40 border-t-transparent"></div>
                    </div>
                    <span className="text-[10px] font-medium tracking-tight text-accents-4">© 2026 Svay Intelligence. All rights reserved.</span>
                </div>
                <div className="flex gap-6 text-[11px] font-medium text-accents-4">
                    <Link href="/support" className="transition-colors hover:text-white">Support</Link>
                    <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
                    <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
