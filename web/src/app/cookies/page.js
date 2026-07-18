"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Shield, Scale, Info, RefreshCw } from 'lucide-react';

export default function CookiesPage() {
  const { isSignedIn } = useAuth();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(document.cookie.includes("demo_mode=true"));
  }, []);

  const isUserLoggedIn = isSignedIn || isDemo;

  const legalNav = [
    { name: "Privacy Policy", href: "/privacy", icon: Shield, active: false },
    { name: "Terms of Service", href: "/terms", icon: Scale, active: false },
    { name: "Cookie Policy", href: "/cookies", icon: Info, active: true },
    { name: "Refund Policy", href: "/refund", icon: RefreshCw, active: false },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col font-sans selection:bg-brand-volt selection:text-black overflow-x-hidden">
      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link 
            href="/" 
            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-900 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-volt via-[#00b0ff] to-brand-mint shrink-0" />
            <span className="font-logo font-black text-sm text-white tracking-tight uppercase shrink-0">SVAY</span>
            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest pl-2 border-l border-zinc-800 shrink-0">Legal</span>
          </div>
        </div>

        <Link 
          href="/" 
          className="text-zinc-400 hover:text-white transition-colors uppercase tracking-wider text-[10px] font-bold shrink-0"
        >
          {isUserLoggedIn ? "Dashboard →" : "Home →"}
        </Link>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
        {/* Sidebar Nav */}
        <aside className="md:col-span-3 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar gap-1 border-b md:border-b-0 md:border-r border-zinc-900/60 pb-4 md:pb-0 md:pr-6 shrink-0 sticky top-[72px]">
          <p className="hidden md:block text-[9px] font-black text-zinc-550 uppercase tracking-widest mb-3 px-3">Legal Center</p>
          {legalNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-left transition-all border shrink-0 md:shrink ${
                  item.active 
                    ? 'bg-zinc-900/60 border-zinc-800 text-white font-extrabold shadow-sm' 
                    : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-950'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.active ? 'text-brand-volt' : 'text-zinc-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </aside>

        {/* Content */}
        <main className="md:col-span-9 space-y-6 text-left min-w-0 max-w-3xl">
          <div className="space-y-4">
            <h1 className="font-display font-extrabold text-2.5xl md:text-3.5xl text-white uppercase tracking-tight leading-none">Cookie Policy</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We believe in transparency. This policy outlines how and why we use cookies to secure your account, process payments, and save your dashboard state.
            </p>
            <p className="text-zinc-500 text-[10px] font-mono">Last updated: June 28, 2026</p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-zinc-400 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">1. What Are Cookies?</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: Cookies are small text files stored on your browser to help websites remember you.
              </div>
              <p>
                Cookies and local browser storage are used by almost all web applications to recognize devices, keep active login sessions open, and store user preferences.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">2. How <span className="font-logo">Svay</span> Uses Cookies</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: We use cookies to verify who you are, secure transaction processing, and remember settings.
              </div>
              <p>
                We do not track you across other websites. We use cookies and local storage tokens strictly to run our features:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Authentication:</strong> Clerk sets session identification cookies to keep you signed in securely as you navigate between dashboard modules.</li>
                <li><strong>Functional state:</strong> We set a `demo_mode` cookie when you launch our workspace preview so the dashboard knows to run in demo sandbox mode.</li>
                <li><strong>Security & Billing:</strong> Dodo Payments implements cookies during billing cycles to ensure checkout sessions are secure and transactions are validated.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">3. Managing Cookie Settings</h2>
              <p>
                You can block or delete cookies through your web browser's setting menus. However, please note that blocking essential authentication cookies (such as Clerk's session cookies) will prevent you from logging in and accessing your private workspace.
              </p>
            </section>
          </div>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-900 py-6 text-center text-[9px] font-mono text-zinc-655 font-bold uppercase tracking-widest relative z-10 bg-black">
        © 2026 Svay Intelligence Platform · All Systems Protected
      </footer>
    </div>
  );
}
