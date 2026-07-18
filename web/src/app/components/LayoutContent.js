'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from "@clerk/nextjs";
import { Plus, Menu, X, Search, Zap, Users, Trophy, BookOpen, BarChart3, Activity, Radio, HelpCircle, SlidersHorizontal, Trash2, CreditCard, LifeBuoy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChannel } from '@/contexts/channel';
import { useUser } from '@/contexts/user';
import PinnedChannels from "./PinnedChannels";
import ResearchNotesModal from "./ResearchNotesModal";
import SetupUserChannelModal from "./SetupUserChannelModal";
import RemoveUserChannelModal from "./RemoveUserChannelModal";

const navItems = [
  { name: 'Search', href: '/', icon: Search },
  { name: 'Trends', href: '/radar', icon: Zap },
  { name: 'Channels', href: '/channels', icon: Users },
  { name: 'Competitors', href: '/competitors', icon: Trophy },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Library', href: '/library', icon: BookOpen },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Support', href: '/support', icon: LifeBuoy },
  { name: 'Docs', href: '/docs', icon: HelpCircle },
];

export default function LayoutContent({ children, subscription }) {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Automatically prompt to connect channel if none is connected.
  // Skip on care pages (support/billing) so paywall users can reach help
  // without being blocked by the non-dismissible channel setup modal.
  useEffect(() => {
    const isDemoCookie = document.cookie.includes("demo_mode=true");
    const isCarePage =
      pathname.startsWith("/support") || pathname.startsWith("/billing");
    if (!loading && !isDemoCookie && !userChannel && !isCarePage) {
      setIsSetupModalOpen(true);
    }
  }, [loading, userChannel, pathname]);


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
          const isActive = pathname === item.href;
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

  return (
    <div className="flex h-full overflow-hidden bg-black text-white font-sans selection:bg-geist-success selection:text-white">
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

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-accents-2 bg-accents-1 flex flex-col shrink-0 hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-accents-1 border-r border-accents-2 z-[101] flex flex-col md:hidden shadow-2xl"
            >
              <SidebarContent />
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 right-4 p-2 text-accents-4 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        <header className="h-14 border-b border-accents-2 flex items-center justify-between px-4 md:px-8 bg-black/80 backdrop-blur-md shrink-0 sticky top-0 z-50">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 text-accents-4 hover:text-white md:hidden transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-geist-success shadow-[0_0_8px_rgba(0,112,243,0.5)]"></div>
                <span className="font-display text-xs font-bold text-accents-5 uppercase tracking-tighter">System Online</span>
              </div>
          </div>
          <div className="flex items-center gap-3">
              {isDemo && (
                <button 
                  onClick={toggleDemoMode}
                  className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 px-2.5 py-1 rounded-full text-yellow-500 transition-colors cursor-pointer"
                  title="Click to Exit Demo Mode"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                  <span className="font-display text-[10px] font-bold uppercase tracking-tight">Demo Mode</span>
                </button>
              )}
              <Link
                href="/support"
                className="flex items-center justify-center p-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Customer care"
              >
                <LifeBuoy className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/billing"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full border border-white/10 transition-colors"
                title="Manage subscription"
              >
                <Zap className="w-3 h-3 text-geist-success" fill="currentColor" />
                <span className="font-display text-[10px] font-bold text-white uppercase tracking-tight">Pro</span>
              </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative bg-black">
          <div className="max-w-[1600px] mx-auto min-h-full flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            
            <footer className="min-h-[88px] py-6 md:py-0 border-t border-accents-2 px-8 mt-auto flex items-center">
              <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[2.5px] border-t-transparent border-l-[4px] border-l-white/40 border-b-[2.5px] border-b-transparent ml-0.5"></div>
                    </div>
                    <span className="text-[10px] font-medium text-accents-4 tracking-tight">© 2026 Svay Intelligence. All rights reserved.</span>
                </div>
                <div className="flex gap-6 text-[11px] font-medium text-accents-4">
                    <Link href="/support" className="hover:text-white transition-colors">Support</Link>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
