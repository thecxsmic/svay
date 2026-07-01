"use client";

import { useState } from "react";
import Script from "next/script";

export default function PaymentButton({ amount, planName = "Pro Plan", onSuccess, onError }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Create order on the backend
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount * 100 }), // convert to paise
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Failed to create order");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Svay Intelligence",
        description: `Upgrade to ${planName}`,
        order_id: orderData.id,
        handler: async function (response) {
          // 2. Verify payment on the backend
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            alert("Payment Successful! Your account has been upgraded.");
            if (onSuccess) onSuccess(verifyData);
          } else {
            alert("Payment Verification Failed: " + (verifyData.message || "Unknown error"));
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
      
      rzp.on('payment.failed', function (response){
        alert("Payment Failed: " + response.error.description);
        if (onError) onError(response.error);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (error) {
      console.error("Payment Flow Error:", error);
      alert("Error: " + error.message);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
      >
        {isProcessing ? "Processing..." : "Upgrade Now"}
      </button>
    </>
  );
}
