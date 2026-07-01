"use client";

import { useState } from "react";
import Script from "next/script";

export default function SubscriptionButton({ planName = "Neural Pro", planType = "monthly", onSuccess, onError }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscription = async () => {
    setIsProcessing(true);
    try {
      // 1. Create subscription on the backend
      const res = await fetch("/api/razorpay/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });

      const subscriptionData = await res.json();
      if (!res.ok) throw new Error(subscriptionData.error || "Failed to create subscription");

      console.log("[Razorpay] Subscription Created:", subscriptionData.id);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionData.id,
        name: "Svay Intelligence",
        description: `7-Day Free Trial - then ${planType === "yearly" ? "₹699/mo (billed yearly)" : "₹999/mo"}`,
        handler: async function (response) {
          setIsProcessing(true);
          // 2. Verify payment on the backend
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              is_subscription: true
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            setIsSuccess(true);
            setTimeout(() => {
               window.location.reload(); 
            }, 2500);
            if (onSuccess) onSuccess(verifyData);
          } else {
            alert("Verification Failed: " + (verifyData.message || "Unknown error"));
            setIsProcessing(false);
            if (onError) onError(verifyData);
          }
        },
        prefill: {
          name: "Svay Administrator",
          email: "admin@svay.space",
        },
        theme: {
          color: "#0070f3",
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Subscription Flow Error:", error);
      alert("Error: " + error.message);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
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
        className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3"
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
