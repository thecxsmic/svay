"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Shield, Scale, Info, RefreshCw } from 'lucide-react';

export default function PrivacyPage() {
  const { isSignedIn } = useAuth();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(document.cookie.includes("demo_mode=true"));
  }, []);

  const isUserLoggedIn = isSignedIn || isDemo;

  const legalNav = [
    { name: "Privacy Policy", href: "/privacy", icon: Shield, active: true },
    { name: "Terms of Service", href: "/terms", icon: Scale, active: false },
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
            <h1 className="font-ahsing font-extrabold text-2.5xl md:text-3.5xl text-white uppercase tracking-tight leading-none">Privacy Policy</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Privacy isn't a legal box for us to check. It's a key part of how we build tools. We believe you should always know what data we collect, why we collect it, and how we protect your rights as a creator. Below, we've broken down our privacy practices in plain English alongside the necessary legal terms.
            </p>
            <p className="text-zinc-500 text-[10px] font-mono">Last updated: June 28, 2026</p>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-zinc-400 space-y-6 leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">1. The Data We Collect</h2>
              <div className="text-zinc-500 text-xs mb-2 italic">
                Quick summary: We only collect information that is strictly necessary to log you in, calculate your analytics, and secure your account.
              </div>
              <p>
                To operate the Svay dashboard and run our metrics calculations, we collect and process the following information:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Account Credentials:</strong> We use Clerk to handle user login and account security. When you sign up, Clerk stores your name, email address, profile photo, and social login metadata.</li>
                <li><strong>YouTube Channel Metrics:</strong> If you connect your channel, we fetch public metadata (your channel name, ID, and thumbnail image) and public channel performance metrics (subscriber totals, weekly view metrics) through Google's API services.</li>
                <li><strong>Your Inputs:</strong> We store search term queries, competitor handles/IDs, saved videos, outlines, and script ideas that you actively save in your workspace library.</li>
                <li><strong>Billing Information:</strong> All payments are processed securely by Razorpay. We do not store your credit card or bank details on our servers. Razorpay provides us with basic payment status logs and verification tokens.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">2. How We Process Your Data</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: Your metrics are used to generate custom growth indicators. We do not share your private notes or sell your profile data.
              </div>
              <p>
                We process your information to deliver and refine our dashboard tools. Specifically, we:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Calculate opportunity percentages and virality indicators for search terms.</li>
                <li>Aggregate public competitor data to build growth curves and format benchmarks.</li>
                <li>Save and display reference material, outlines, and drafts in your private library.</li>
              </ul>
              <p>
                We do not sell your personal data or channel information to data brokers, advertising networks, or other third parties. Your notes, scripts, and drafts are treated as confidential creator property.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">3. Third-Party Services We Use</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: We partner with specialized third-party platforms to handle login security, payment cycles, and metric retrieval.
              </div>
              <p>
                We share data with the following partners only to run our platform:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Clerk:</strong> Provides secure authentication gates and user profile protection.</li>
                <li><strong>Razorpay:</strong> Handles subscription cycles, payment security, and renewals.</li>
                <li><strong>YouTube API Services:</strong> Retrieves public channel statistics. By using Svay, you agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-brand-volt underline">YouTube Terms of Service</a> and the <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-volt underline">Google Privacy Policy</a>. You can manage or revoke this access at any time through Google's security settings.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">4. Data Security & Deletion</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: We encrypt your data in transit and delete your information when you request account closure.
              </div>
              <p>
                All data moving between your browser and our servers is encrypted using standard TLS protocols. Authorized API access tokens are stored securely. We retain account metadata as long as your workspace account is active. If you delete your account, we wipe your personal information and metadata from our active systems within 30 days.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-white text-base font-bold uppercase tracking-wider">5. Your Control & Rights</h2>
              <div className="text-zinc-550 text-xs mb-2 italic">
                Quick summary: You own your data. You can access, edit, or delete your account whenever you choose.
              </div>
              <p>
                We believe you should have complete control over your information. Under data protection regulations (such as GDPR), you have the right to request access to your data, fix errors, or ask for complete deletion of your workspace logs. You can delete linked YouTube channel tokens or cancel your profile directly from your settings. For questions about your data, email us at <a href="mailto:help@svay.space" className="text-brand-volt font-mono">help@svay.space</a>.
              </p>
            </section>
          </div>
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-900 py-6 text-center text-[9px] font-mono text-zinc-650 font-bold uppercase tracking-widest relative z-10 bg-black">
        © 2026 Svay Intelligence Platform · All Systems Protected
      </footer>
    </div>
  );
}
