'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from "@clerk/nextjs";
import { Plus, Menu, X, Search, Zap, Users, Trophy, BookOpen, BarChart3, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PinnedChannels from "./PinnedChannels";
import ResearchNotesModal from "./ResearchNotesModal";

const navItems = [
  { name: 'Search', href: '/', icon: Search },
  { name: 'Trends', href: '/radar', icon: Zap },
  { name: 'Channels', href: '/channels', icon: Users },
  { name: 'Competitors', href: '/competitors', icon: Trophy },
  { name: 'Library', href: '/library', icon: BookOpen },
];

export default function LayoutContent({ children }) {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-geist-success via-[#00dfd8] to-geist-success animate-logo-gradient shadow-[0_0_15px_rgba(0,112,243,0.3)] group-hover:shadow-[0_0_20px_rgba(0,112,243,0.5)] transition-shadow" />
          <span className="font-logo text-xl tracking-tight text-white uppercase">Vyron</span>
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
      </nav>

      <div className="h-[88px] p-4 border-t border-accents-2 mt-auto flex items-center">
        <div className="w-full bg-accents-1 border border-accents-2 rounded-lg p-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
            <UserButton appearance={{ 
              elements: { 
                userButtonAvatarBox: "w-8 h-8 border border-white/10" 
              } 
            }} />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-white uppercase tracking-tight truncate">Pro Account</p>
              <p className="text-[8px] text-accents-4 font-bold uppercase tracking-widest">Status: Active</p>
            </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-full overflow-hidden bg-black text-white font-sans selection:bg-geist-success selection:text-white">
      <ResearchNotesModal 
        isOpen={isNotesModalOpen} 
        onClose={() => setIsNotesModalOpen(false)} 
      />

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
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                <Zap className="w-3 h-3 text-geist-success" fill="currentColor" />
                <span className="font-display text-[10px] font-bold text-white uppercase tracking-tight">Pro</span>
              </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar relative bg-black">
          <div className="max-w-[1600px] mx-auto min-h-full flex flex-col">
            <div className="flex-1">
              {children}
            </div>
            
            <footer className="h-[88px] border-t border-accents-2 px-8 mt-auto flex items-center">
              <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 bg-white/10 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[2.5px] border-t-transparent border-l-[4px] border-l-white/40 border-b-[2.5px] border-b-transparent ml-0.5"></div>
                    </div>
                    <span className="text-[10px] font-medium text-accents-4 tracking-tight">© 2026 Vyron Intelligence. All rights reserved.</span>
                </div>
                <div className="flex gap-6 text-[11px] font-medium text-accents-4">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">GitHub</a>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
