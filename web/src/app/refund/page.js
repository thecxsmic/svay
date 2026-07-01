"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Shield, Scale, Info, RefreshCw } from 'lucide-react';

export default function RefundPage() {
  const { isSignedIn } = useAuth();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(document.cookie.includes("demo_mode=true"));
  }, []);

  const isUserLoggedIn = isSignedIn || isDemo;

  const legalNav = [
    { name: "Privacy Policy", href: "/privacy", icon: Shield, active: false },
    { name: "Terms of Service", href: "/terms", icon: Scale, active: false },
    { name: "Cookie Policy", href: "/cookies", icon: Info, active: false },
    { name: "Refund Policy", href: "/refund", icon: RefreshCw, active: true },
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
            <span className="font-display font-extrabold text-sm text-white tracking-tight uppercase shrink-0">SVAY</span>
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
            <h1 className="font-display font-extrabold text-2.5xl md:text-3.5xl text-white uppercase tracking-tight leading-none">Refund & Cancellation Policy</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              We want you to be completely satisfied with Svay. This policy outlines how subscriptions are managed, when renewals occur, and how to cancel or address billing discrepancies.
            </p>
            <p className="text-zinc-500 text-[10px] font-mono">Last updated: June 28, 2026</p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-zinc-400 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">1. Cancellation Policy</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: You can cancel your subscription with a single click inside your dashboard settings.
              </div>
              <p>
                You can cancel your subscription at any time. To cancel, navigate to your Billing/Settings section inside the dashboard and select &quot;Cancel Subscription.&quot; 
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Trial Cancellation:</strong> If you cancel during the 7-day free trial period, your account will revert to the free tier at the end of the trial, and your payment method will not be charged.</li>
                <li><strong>Active Subscription Cancellation:</strong> If you cancel after a billing cycle has started, you will retain access to Pro features until the end of your current billing cycle. No further recurring charges will be initiated.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">2. Refund Guidelines</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: We do not offer refunds for partial months, but we will review transaction errors.
              </div>
              <p>
                Because Svay provides real-time access to computed creator intelligence, we do not offer pro-rata refunds for partial months or unused time once a billing cycle is charged.
              </p>
              <p>
                However, if you notice double billing or transaction processing errors by Razorpay, please email our support team at <a href="mailto:help@svay.space" className="text-brand-volt font-mono">help@svay.space</a> within 7 days of the charge. We will audit the transaction logs and issue credit adjustments where appropriate.
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
