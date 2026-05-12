import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ClerkProvider, Show, UserButton, SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getSubscriptionStatus } from "@/lib/auth/subscription";
import { UserProvider } from "@/contexts/user";
import { ChannelProvider } from "@/contexts/channel";
import { BottomSheetProvider } from "@/contexts/bottomSheet";
import PaymentButton from "./components/PaymentButton";
import SubscriptionButton from "./components/SubscriptionButton";
import PinnedChannels from "./components/PinnedChannels";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vyron Intelligence",
  description: "Advanced Content Ecosystem Tracking",
};

export default async function RootLayout({ children }) {
  const { userId } = await auth();
  const subscription = userId ? await getSubscriptionStatus(userId) : null;
  const isSubscribed = subscription?.isActive;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full bg-black text-[#ededed] selection:bg-[#0070f3] selection:text-white">
        <ClerkProvider>
          <UserProvider>
            <ChannelProvider>
              <BottomSheetProvider>
                <Show when="signed-in">
                  {isSubscribed ? (
                    <div className="flex h-full overflow-hidden">
                      {/* Sidebar */}
                      <aside className="w-64 border-r border-white/5 bg-[#050505] flex flex-col shrink-0 hidden md:flex">
                        <div className="p-8">
                          <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-black border-b-[5px] border-b-transparent ml-0.5"></div>
                            </div>
                            <span className="font-black text-xl tracking-tighter text-white uppercase italic">Vyron</span>
                          </Link>
                        </div>

                        <nav className="flex-1 px-4 space-y-1 mt-4">
                          <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] px-4 mb-4">Core Intelligence</p>
                          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-white bg-white/5 border border-white/5 transition-all">
                            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            Intelligence
                          </Link>
                          <Link href="/radar" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#888] hover:text-white hover:bg-white/5 transition-all">
                            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Trend Radar
                          </Link>
                          <Link href="/channels" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#888] hover:text-white hover:bg-white/5 transition-all">
                            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Ecosystem
                          </Link>
                          <Link href="/ideas" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#888] hover:text-white hover:bg-white/5 transition-all">
                            <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            Ideas
                          </Link>
                          
                          <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] px-4 mb-4 mt-10">Advanced</p>
                          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#444] hover:text-[#888] transition-all">
                             <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                             Analytics
                          </Link>
                          <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[#444] hover:text-[#888] transition-all">
                             <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                             Predictive
                          </Link>

                          <p className="text-[10px] font-black text-[#333] uppercase tracking-[0.2em] px-4 mb-4 mt-10">Pinned Channels</p>
                          <PinnedChannels />
                        </nav>

                        <div className="p-4 mt-auto">
                           <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <UserButton appearance={{ 
                                    elements: { 
                                      userButtonAvatarBox: "w-8 h-8 border border-white/10 hover:border-[#0070f3] transition-colors" 
                                    } 
                                 }} />
                                 <div className="overflow-hidden">
                                    <p className="text-[10px] font-black text-white uppercase truncate">Session Active</p>
                                    <p className="text-[8px] font-bold text-[#444] uppercase tracking-widest">Administrator</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </aside>

                      {/* Main Content Area */}
                      <div className="flex-1 flex flex-col overflow-hidden bg-black">
                        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-xl shrink-0">
                          <div className="flex items-center gap-4">
                             <div className="w-2 h-2 rounded-full bg-[#00dfd8] animate-pulse"></div>
                             <span className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em]">Neural Engine v4.2 // Active</span>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="h-4 w-px bg-white/10"></div>
                             <button className="text-[10px] font-black text-[#888] hover:text-white uppercase tracking-widest transition-colors">Documentation</button>
                             <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0070f3]"></div>
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Neural Pro Active</span>
                             </div>
                          </div>
                        </header>
                        <main className="flex-1 overflow-y-auto scroll-smooth">
                          {children}
                          <footer className="border-t border-white/5 py-12 px-8 mt-20">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                              <div className="flex items-center gap-3">
                                 <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
                                    <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-white/50 border-b-[3px] border-b-transparent ml-0.5"></div>
                                 </div>
                                 <span className="text-[9px] font-black text-[#222] uppercase tracking-[0.3em]">Built for the future of content ecosystems</span>
                              </div>
                              <div className="flex gap-8 text-[9px] font-black text-[#333] uppercase tracking-widest">
                                 <a href="#" className="hover:text-white transition-colors">Privacy</a>
                                 <a href="#" className="hover:text-white transition-colors">Terms</a>
                                 <a href="#" className="hover:text-white transition-colors">GitHub</a>
                              </div>
                            </div>
                          </footer>
                        </main>
                      </div>
                    </div>
                  ) : (
                    /* Pricing / Subscription Required Page */
                    <div className="min-h-screen bg-black flex items-center justify-center p-8">
                      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                         <div className="space-y-8">
                            {subscription?.isHalted ? (
                              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
                                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                 <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Payment Failed / Halted</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 bg-[#0070f3]/10 border border-[#0070f3]/20 px-4 py-2 rounded-full">
                                 <div className="w-2 h-2 rounded-full bg-[#0070f3] animate-pulse"></div>
                                 <span className="text-[10px] font-black text-[#0070f3] uppercase tracking-widest">Premium Intelligence Only</span>
                              </div>
                            )}
                            
                            <h1 className="text-5xl font-black tracking-tighter text-white uppercase leading-[0.9]">
                              {subscription?.isHalted ? "Billing Issue Detected." : subscription?.isExpired ? "Subscription Expired." : "Unlock the Neural Engine."}
                            </h1>
                            <p className="text-[#888] text-lg font-medium leading-relaxed">
                              {subscription?.isHalted 
                                ? "We were unable to process your recent payment. Please update your billing information or retry to restore access."
                                : "Vyron is a professional-grade ecosystem tracker. Access requires an active subscription to maintain neural compute integrity."}
                            </p>
                            
                            <ul className="space-y-4">
                               {[
                                 "Real-time Viral Coefficient Analysis",
                                 "Deep Channel Momentum Projection",
                                 "Advanced Vector-based Market Search",
                                 "7-Day Full Access Free Trial"
                               ].map((feature, i) => (
                                 <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#444]">
                                   <svg className="w-5 h-5 text-[#0070f3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                   {feature}
                                 </li>
                               ))}
                            </ul>
                         </div>

                         <div className="bg-[#080808] border border-white/5 p-10 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8">
                               <UserButton />
                            </div>
                            <p className="text-[10px] font-black text-[#666] uppercase tracking-[0.3em] mb-4">Selected Plan</p>
                            <h2 className="text-3xl font-black text-white uppercase mb-2">Neural Pro</h2>
                            <div className="flex items-baseline gap-2 mb-8">
                               <span className="text-5xl font-black text-white tracking-tighter">999</span>
                               <span className="text-sm font-bold text-[#444] uppercase tracking-widest">/ Month</span>
                            </div>
                            
                            <div className="space-y-6">
                              <SubscriptionButton />
                              <p className="text-[9px] text-center font-bold text-[#222] uppercase tracking-widest">
                                {subscription?.isHalted ? "Access blocked until payment is resolved." : "No commitment. Cancel anytime during trial."}
                              </p>
                            </div>

                            <div className="mt-10 pt-10 border-t border-white/5">
                               <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-[#444] uppercase tracking-widest">Compute Priority</span>
                                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {subscription?.isHalted ? "Suspended" : "High / Tier 1"}
                                  </span>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  )}
                </Show>
                <Show when="signed-out">
                  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
                    <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                      <div className="mb-8 text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                          <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-black border-b-[8px] border-b-transparent ml-1"></div>
                        </div>
                        <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Vyron Intelligence</h1>
                        <p className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] mt-2">Authentication Required</p>
                      </div>
                      <SignIn 
                        routing="hash"
                        appearance={{
                          elements: {
                            rootBox: "mx-auto w-full",
                            card: "bg-[#080808] border border-white/5 shadow-2xl rounded-[2.5rem] w-full",
                            headerTitle: "text-white uppercase font-black tracking-tighter",
                            headerSubtitle: "text-[#888] font-medium",
                            socialButtonsBlockButton: "bg-white/5 border-white/5 text-white hover:bg-white/10 transition-all",
                            formButtonPrimary: "bg-white text-black hover:bg-[#ededed] transition-all uppercase font-black tracking-widest text-[10px]",
                            footerActionLink: "text-[#0070f3] hover:text-[#00dfd8] transition-colors",
                            formFieldLabel: "text-[#444] uppercase font-black text-[9px] tracking-widest",
                            formFieldInput: "bg-black border-white/10 text-white focus:border-[#0070f3] transition-all",
                            dividerText: "text-[#222] uppercase font-black text-[9px]",
                            dividerLine: "bg-white/5"
                          }
                        }} 
                      />
                    </div>
                  </div>
                </Show>
              </BottomSheetProvider>
            </ChannelProvider>
          </UserProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
