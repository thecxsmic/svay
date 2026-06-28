"use client";

import { usePathname } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import LayoutContent from "./LayoutContent";
import LandingPage from "./LandingPage";
import SubscriptionButton from "./SubscriptionButton";
import DemoLoginButton from "./DemoLoginButton";

export default function RouteGater({ children, initialIsSubscribed, initialSubscription }) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(document.cookie.includes("demo_mode=true"));
  }, [pathname]); // Refresh demo cookie detection on route transition

  if (!isLoaded) {
    // Still render public pages while Clerk is loading to avoid blank screen
    if (pathname.startsWith("/sign-in") || pathname.startsWith("/docs")) {
      return <div className="w-full text-[#ededed]">{children}</div>;
    }
    return <div className="min-h-screen bg-black" />;
  }

  const isPublicPage = pathname.startsWith("/sign-in") || pathname.startsWith("/docs");

  if (isDemoMode) {
    if (isPublicPage) {
      return <div className="w-full text-[#ededed]">{children}</div>;
    }
    return <LayoutContent>{children}</LayoutContent>;
  }

  if (isPublicPage) {
    return <div className="w-full text-[#ededed]">{children}</div>;
  }

  if (isSignedIn) {
    if (initialIsSubscribed) {
      return <LayoutContent>{children}</LayoutContent>;
    } else {
      /* Pricing / Subscription Required Page */
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-volt/10 rounded-full filter blur-[100px] pointer-events-none z-0" />

          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center relative z-10 my-8">
             {/* Left column (Info) */}
             <div className="md:col-span-6 space-y-6 text-left">
                {initialSubscription?.isHalted ? (
                  <div className="inline-flex items-center gap-2 bg-brand-rose/10 border border-brand-rose/20 px-3.5 py-1.5 rounded-full">
                     <div className="w-1.5 h-1.5 rounded-full bg-brand-rose animate-pulse"></div>
                     <span className="text-[10px] font-black text-brand-rose uppercase tracking-widest">Payment Required</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-brand-volt/10 border border-brand-volt/20 px-3.5 py-1.5 rounded-full">
                     <div className="w-1.5 h-1.5 rounded-full bg-brand-volt animate-pulse"></div>
                     <span className="text-[10px] font-black text-brand-volt uppercase tracking-widest">Pro Access Only</span>
                  </div>
                )}
                
                <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-none uppercase">
                  {initialSubscription?.isHalted ? "Update Billing." : initialSubscription?.isExpired ? "Plan Expired." : "Upgrade to Pro."}
                </h1>
                <p className="text-zinc-400 text-sm md:text-base font-normal leading-relaxed">
                  {initialSubscription?.isHalted 
                    ? "We couldn't process your payment. Please update your billing info to continue."
                    : "Unlock advanced tracking, real-time viral analysis, and deep insights with Vyron Pro."}
                </p>
                
                <ul className="space-y-3 pt-2">
                   {[
                     "Real-time viral analysis & breakout radar",
                     "Creator growth benchmarks & matrix tracker",
                     "Advanced content query search & score matching",
                     "7-day trial included with instant cancellation"
                   ].map((feature, i) => (
                     <li key={i} className="flex items-start gap-3 text-xs md:text-sm font-medium text-zinc-350">
                       <span className="text-brand-volt font-bold shrink-0 mt-0.5">→</span>
                       <span>{feature}</span>
                     </li>
                   ))}
                </ul>
             </div>

             {/* Right column (Card) */}
             <div className="md:col-span-6 bg-zinc-950/70 border border-white/[0.08] p-6 md:p-10 rounded-[2.5rem] shadow-[0_24px_80px_rgba(0,0,0,0.9)] backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
                {/* Top border gradient line */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-volt to-brand-mint opacity-80" />

                {/* User profile badge in header */}
                <div className="flex justify-between items-center mb-8 border-b border-zinc-900/80 pb-5">
                   <div>
                     <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Selected Plan</p>
                     <h2 className="font-display font-extrabold text-xl text-white uppercase mt-0.5">Pro Plan</h2>
                   </div>
                   <div className="flex items-center gap-3">
                     <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 border border-white/10" } }} />
                   </div>
                </div>

                <div className="flex items-baseline gap-2 mb-6">
                   <span className="text-3xl font-extrabold text-zinc-500">₹</span>
                   <span className="text-5xl md:text-6xl font-extrabold text-white tracking-tight">499</span>
                   <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">/ Month</span>
                </div>

                <div className="flex items-center gap-2 mb-8">
                  <span className="text-zinc-500 line-through text-xs font-bold">₹999/mo</span>
                  <span className="bg-brand-rose/15 text-brand-rose border border-brand-rose/25 font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">SAVE 50%</span>
                </div>
                
                <div className="space-y-5">
                   <SubscriptionButton />
                   
                   <div className="relative flex py-2 items-center">
                     <div className="flex-grow border-t border-zinc-900"></div>
                     <span className="flex-shrink mx-4 text-zinc-655 uppercase font-black text-[9px] tracking-widest">Or</span>
                     <div className="flex-grow border-t border-zinc-900"></div>
                   </div>

                   <DemoLoginButton 
                     label="Explore Demo Version" 
                     className="w-full py-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-355 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 hover:-translate-y-0.5" 
                   />
                   <p className="text-[9px] text-center font-bold text-zinc-500 uppercase tracking-widest pt-1">
                     {initialSubscription?.isHalted ? "Access restricted until resolved." : "Cancel at any time during trial."}
                   </p>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-900/80 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                   <span className="text-zinc-500">Support Level</span>
                   <span className="text-brand-volt">Priority Support</span>
                </div>
             </div>
          </div>
        </div>
      );
    }
  }

  return <LandingPage />;
}
