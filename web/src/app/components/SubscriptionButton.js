"use client";

import { useState } from "react";
import { useUser } from "@/contexts/user";

export default function SubscriptionButton({ planName = "Neural Pro", planType = "monthly", onSuccess, onError }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { user } = useUser();

  const handleSubscription = async () => {
    setIsProcessing(true);
    try {
      // 1. Create checkout session on the backend
      const res = await fetch("/api/dodo/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });

      const sessionData = await res.json();
      if (!res.ok) throw new Error(sessionData.error || "Failed to create subscription");

      console.log("[Dodo Payments] Redirecting to checkout:", sessionData.checkoutUrl);
      
      // Redirect customer to the Dodo Payments hosted checkout page
      window.location.href = sessionData.checkoutUrl;
      
    } catch (error) {
      console.error("Subscription Flow Error:", error);
      alert("Error: " + error.message);
      setIsProcessing(false);
      if (onError) onError(error);
    }
  };

  return (
    <>
      {isSuccess && (
        <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="text-center space-y-6 max-w-sm">
              <div className="w-20 h-20 bg-[#0070f3] rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(0,112,243,0.5)]">
                 <svg className="w-10 h-10 text-white animate-in zoom-in duration-500 delay-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                 </svg>
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Neural Engine Initialized</h2>
              <p className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em] leading-relaxed">Identity Verified. Subscription Active. Accessing Neural Core v4.2...</p>
           </div>
        </div>
      )}

      <button
        onClick={handleSubscription}
        disabled={isProcessing}
        className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[11px] sm:text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 sm:gap-3 cursor-pointer"
      >
        {isProcessing && !isSuccess ? (
          <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
        ) : (
          <>
            <span>Start 7-Day Free Trial</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </>
        )}
      </button>
    </>
  );
}
