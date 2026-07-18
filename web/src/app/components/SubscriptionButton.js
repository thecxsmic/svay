"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function SubscriptionButton({
  planType = "monthly",
  label = "Start 7-Day Free Trial",
  onSuccess,
  onError,
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscription = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/dodo/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });

      const sessionData = await res.json();
      if (!res.ok) throw new Error(sessionData.error || "Failed to create subscription");

      console.log("[Dodo Payments] Redirecting to checkout:", sessionData.checkoutUrl);
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
        <div className="fixed inset-0 z-[2000] flex animate-in fade-in items-center justify-center bg-black p-8 duration-500">
          <div className="max-w-sm space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-volt shadow-[0_0_50px_rgba(0,240,255,0.45)]">
              <svg
                className="h-10 w-10 animate-in zoom-in text-black duration-500 delay-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-display text-3xl tracking-tight text-white">
              You&apos;re in.
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] leading-relaxed text-zinc-500">
              Subscription active · Loading Pro workspace…
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubscription}
        disabled={isProcessing}
        className="group relative flex w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-brand-volt py-4 text-[12px] font-black uppercase tracking-[0.12em] text-black shadow-[0_0_40px_rgba(0,240,255,0.28),0_12px_32px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 hover:bg-[#33f3ff] hover:shadow-[0_0_56px_rgba(0,240,255,0.4)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-80 disabled:hover:translate-y-0 sm:text-sm sm:tracking-[0.14em]"
      >
        {isProcessing && !isSuccess ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        ) : (
          <>
            <span>{label}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={2.75} />
          </>
        )}
      </button>
    </>
  );
}
