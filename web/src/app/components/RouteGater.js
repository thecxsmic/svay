"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import LayoutContent from "./LayoutContent";
import LandingPage from "./LandingPage";
import UpgradeGate from "./UpgradeGate";

export default function RouteGater({ children, initialIsSubscribed, initialSubscription }) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");

  // Promo code states
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  useEffect(() => {
    setIsDemoMode(document.cookie.includes("demo_mode=true"));
    const match = document.cookie.match(/selected_plan=(monthly|yearly)/);
    if (match) {
      setBillingInterval(match[1]);
    }
  }, [pathname]); // Refresh demo cookie detection on route transition

  // Fallback: after Dodo checkout (or if webhooks failed), pull sub from Dodo → Turso
  useEffect(() => {
    if (!isLoaded || !isSignedIn || initialIsSubscribed || isDemoMode) return;

    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const fromCheckout = params?.get("checkout") === "success";
    // Always try once when paywall is shown; more aggressively right after checkout
    const key = "svay_dodo_sync_attempted";
    if (!fromCheckout && sessionStorage.getItem(key) === "1") return;

    let cancelled = false;
    (async () => {
      try {
        sessionStorage.setItem(key, "1");
        const res = await fetch("/api/dodo/sync", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.success && data.found) {
          // Clean query string then reload so layout re-reads subscription
          const url = new URL(window.location.href);
          url.searchParams.delete("checkout");
          url.searchParams.delete("plan");
          window.location.replace(url.pathname + url.search);
        }
      } catch (err) {
        console.warn("[Dodo Sync] client reconcile failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, initialIsSubscribed, isDemoMode]);

  const handleRedeemPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    setIsRedeeming(true);
    setPromoError("");
    setPromoSuccess("");

    try {
      const res = await fetch("/api/promo/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to redeem promo code");
      }

      setPromoSuccess(data.message);
      setPromoCode("");
      
      // Reload page to refresh initialIsSubscribed
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setIsRedeeming(false);
    }
  };

  const isPublicPage = pathname.startsWith("/sign-in") || 
                       pathname.startsWith("/docs") ||
                       pathname.startsWith("/privacy") ||
                       pathname.startsWith("/terms") ||
                       pathname.startsWith("/cookies") ||
                       pathname.startsWith("/refund") ||
                       pathname.startsWith("/shared");

  if (!isLoaded) {
    // Still render public pages / landing while Clerk is loading to avoid blank screen
    if (isPublicPage) {
      return <div className="w-full text-[#ededed]">{children}</div>;
    }
    return <LandingPage />;
  }

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
      return <LayoutContent subscription={initialSubscription}>{children}</LayoutContent>;
    } else {
      return (
        <UpgradeGate
          billingInterval={billingInterval}
          setBillingInterval={setBillingInterval}
          initialSubscription={initialSubscription}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          showPromoInput={showPromoInput}
          setShowPromoInput={setShowPromoInput}
          isRedeeming={isRedeeming}
          promoError={promoError}
          promoSuccess={promoSuccess}
          onRedeemPromo={handleRedeemPromo}
        />
      );
    }
  }

  return <LandingPage />;
}
