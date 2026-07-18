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
            <div
              className="mx-auto mt-4 h-8 w-8 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_18px_rgba(0,112,243,0.4)]"
              role="status"
              aria-label="Svay"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubscription}
        disabled={isProcessing}
        className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-white py-3 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-zinc-200 active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
      >
        {isProcessing && !isSuccess ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
        ) : (
          <>
            <span>{label}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
          </>
        )}
      </button>
    </>
  );
}
