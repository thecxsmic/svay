"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Shield, Scale, Info, RefreshCw } from 'lucide-react';

export default function TermsPage() {
  const { isSignedIn } = useAuth();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(document.cookie.includes("demo_mode=true"));
  }, []);

  const isUserLoggedIn = isSignedIn || isDemo;

  const legalNav = [
    { name: "Privacy Policy", href: "/privacy", icon: Shield, active: false },
    { name: "Terms of Service", href: "/terms", icon: Scale, active: true },
    { name: "Cookie Policy", href: "/cookies", icon: Info, active: false },
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
            <h1 className="font-display font-extrabold text-2.5xl md:text-3.5xl text-white uppercase tracking-tight leading-none">Terms of Service</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              These terms form the agreement between you and Svay. We've written them to be clear and straightforward, so you know exactly what rules govern our creator platform and what is expected of both of us.
            </p>
            <p className="text-zinc-500 text-[10px] font-mono">Last updated: June 28, 2026</p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-zinc-400 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">1. Agreement to Terms</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: By creating an account and using Svay, you agree to follow these platform rules.
              </div>
              <p>
                By accessing or using the Svay platform (the &quot;Service&quot;), you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service. If you do not agree, you must stop using the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">2. Account Creation & Security</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: Login is secured by Clerk. Keep your session credentials safe.
              </div>
              <p>
                To access the workspace tools, you must authenticate through our login interface powered by Clerk. You are responsible for keeping your login credentials confidential and for all activity occurring under your account. If you believe your account has been compromised, notify us immediately.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">3. Subscription, Trial Periods & Billing</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: Billing is managed via Razorpay. Trials are free, and you can cancel anytime.
              </div>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Pro Plan Pricing:</strong> We offer full access to our creator intelligence tools under a monthly subscription priced at ₹999/month, or a yearly subscription priced at ₹699/month (billed annually as ₹8,388/year).</li>
                <li><strong>7-Day Free Trial:</strong> New accounts are eligible for a 7-day free trial. If you cancel before the trial concludes, you will not be charged.</li>
                <li><strong>Billing Cycles & Automatic Renewal:</strong> Subscription payments are processed securely by Razorpay. Subscriptions renew automatically each month on the anniversary of your billing date unless cancelled.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">4. Acceptable Platform Use</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: Do not scrape our services, hack our systems, or violate YouTube's terms of service.
              </div>
              <p>
                We build tools to support creators, not to be exploited. You agree not to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Systematically scrape, collect, or crawl data from our platform database.</li>
                <li>Attempt to reverse-engineer our analytical algorithms, Opportunity calculations, or security gates.</li>
                <li>Violate the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-brand-volt underline">YouTube Terms of Service</a> when using connected API features.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">5. Content & Metrics Disclaimer</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: We evaluate public data to guide your content decisions, but we cannot guarantee viral success.
              </div>
              <p>
                Svay indexes public statistics to help you spot formats and trends. However, platform metrics, search scoring values, and competitor benchmarks are offered for informational guidance only. We do not warrant that the metadata retrieved is free from error, or that following these benchmarks will result in specific channel growth.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">6. Contact Us</h2>
              <p>
                If you have questions about these terms or platform rules, email our team at <a href="mailto:help@svay.space" className="text-brand-volt font-mono">help@svay.space</a>.
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
