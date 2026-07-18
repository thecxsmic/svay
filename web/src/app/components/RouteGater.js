"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import SvayLoader from "./SvayLoader";

// Code-split heavy shells so the marketing landing JS stays smaller
const LayoutContent = dynamic(() => import("./LayoutContent"), {
  loading: () => <SvayLoader fullScreen />,
  ssr: true,
});
const LandingPage = dynamic(() => import("./LandingPage"), {
  loading: () => <SvayLoader fullScreen />,
  ssr: true,
});
const UpgradeGate = dynamic(() => import("./UpgradeGate"), {
  loading: () => <SvayLoader fullScreen />,
  ssr: true,
});

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

  // Standalone chrome — no sidebar / channel onboarding modal
  const bare = (content) => (
    <div className="w-full text-[#ededed]">{content}</div>
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
      return bare(children);
    }

    // Optimistic render from server auth — no landing page flash
    if (demoMode) {
      return appShell(children);
    }
    if (signedIn && initialIsSubscribed) {
      return appShell(children);
    }
    if (signedIn && isCarePage) {
      return bare(children);
    }
    if (signedIn && !initialIsSubscribed) {
      return paywall;
    }

    // Anonymous: show marketing landing immediately (SEO + first paint).
    // Never gate the homepage behind a "Loading…" shell while Clerk boots.
    return <LandingPage />;
  }

  if (demoMode) {
    if (isPublicPage) {
      return bare(children);
    }
    return appShell(children);
  }

  if (isPublicPage) {
    return bare(children);
  }

  // Support is public for logged-out visitors (standalone page chrome)
  if (pathname.startsWith("/support") && !signedIn) {
    return bare(children);
  }

  if (signedIn) {
    if (initialIsSubscribed) {
      return appShell(children);
    }
    // From upgrade/paywall: support & billing without app shell / channel modal
    if (isCarePage) {
      return bare(children);
    }
    return paywall;
  }

  return <LandingPage />;
}
