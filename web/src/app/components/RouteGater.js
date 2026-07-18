"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import LayoutContent from "./LayoutContent";
import LandingPage from "./LandingPage";
import UpgradeGate from "./UpgradeGate";

/** Minimal black shell while Clerk hydrates — never flash the marketing landing page */
function AuthLoadingShell() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-geist-success via-[#00f0ff] to-geist-success animate-logo-gradient shadow-[0_0_15px_rgba(0,112,243,0.3)]" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          Loading…
        </p>
      </div>
    </div>
  );
}

export default function RouteGater({
  children,
  initialIsSubscribed,
  initialSubscription,
  initialIsSignedIn = false,
  initialIsDemoMode = false,
}) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState(initialIsDemoMode);
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
  }, [pathname]);

  // Fallback: after Dodo checkout (or if webhooks failed), pull sub from Dodo → Turso
  useEffect(() => {
    if (!isLoaded || !isSignedIn || initialIsSubscribed || isDemoMode) return;

    const params =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const fromCheckout = params?.get("checkout") === "success";
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

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setIsRedeeming(false);
    }
  };

  const isPublicPage =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/cookies") ||
    pathname.startsWith("/refund") ||
    pathname.startsWith("/shared");

  // Always reachable even on the paywall (support + billing care)
  const isCarePage =
    pathname.startsWith("/support") || pathname.startsWith("/billing");

  // Prefer server-known session while Clerk JS is still hydrating
  const signedIn = isLoaded ? isSignedIn : initialIsSignedIn;
  const demoMode = isDemoMode || initialIsDemoMode;

  const appShell = (content) => (
    <LayoutContent subscription={initialSubscription}>{content}</LayoutContent>
  );

  const paywall = (
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

  if (!isLoaded) {
    if (isPublicPage || (pathname.startsWith("/support") && !signedIn && !demoMode)) {
      return <div className="w-full text-[#ededed]">{children}</div>;
    }

    // Optimistic render from server auth — no landing page flash
    if (demoMode) {
      return appShell(children);
    }
    if (signedIn && (initialIsSubscribed || isCarePage)) {
      return appShell(children);
    }
    if (signedIn && !initialIsSubscribed) {
      return paywall;
    }

    // Unknown session: lightweight shell only (not full landing)
    return <AuthLoadingShell />;
  }

  if (demoMode) {
    if (isPublicPage) {
      return <div className="w-full text-[#ededed]">{children}</div>;
    }
    return appShell(children);
  }

  if (isPublicPage) {
    return <div className="w-full text-[#ededed]">{children}</div>;
  }

  // Support is public for logged-out visitors (standalone page chrome)
  if (pathname.startsWith("/support") && !signedIn) {
    return <div className="w-full text-[#ededed]">{children}</div>;
  }

  if (signedIn) {
    if (initialIsSubscribed || isCarePage) {
      return appShell(children);
    }
    return paywall;
  }

  return <LandingPage />;
}
