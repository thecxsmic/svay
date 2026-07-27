'use client';

import { useState, useEffect, useRef } from 'react';
import CardNav from './landing/CardNav';
import { CTASection } from './ui/hero-dithering-card';
import { Features } from '@/components/ui/features-10';
import {
  useCustomCursor,
} from './landing/useLandingHooks';

const enterDemo = (e) => {
  if (e) e.preventDefault();
  document.cookie = 'demo_mode=true; path=/; max-age=31536000;';
  window.location.reload();
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');

  const { mousePos, ringPos, isHovering } = useCustomCursor(isMobile);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 40); setScrollY(window.scrollY); };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleStartTrial = () => {
    document.cookie = `selected_plan=${billingInterval}; path=/; max-age=3600;`;
    window.location.href = '/sign-in';
  };

  const navItems = [
    {
      label: "Product",
      bgColor: "#0d0d11",
      textColor: "#fff",
      links: [
        { label: "Features", href: "#features", ariaLabel: "SVAY Features" },
        { label: "Pricing", href: "#pricing", ariaLabel: "SVAY Pricing" }
      ]
    },
    {
      label: "Resources", 
      bgColor: "#14141a",
      textColor: "#fff",
      links: [
        { label: "Docs", href: "/docs", ariaLabel: "SVAY Docs" },
        { label: "Demo", href: "#", ariaLabel: "Launch Demo", onClick: enterDemo }
      ]
    },
    {
      label: "Portal",
      bgColor: "#25252e", 
      textColor: "#fff",
      links: [
        { label: "Sign In", href: "/sign-in", ariaLabel: "Sign In" },
        { label: "Start Trial", href: "/sign-in", ariaLabel: "Start Trial", onClick: handleStartTrial }
      ]
    }
  ];

  return (
    <div className="relative min-h-screen w-full bg-black overflow-x-hidden">
      {/* Custom cursor (desktop only) */}
      {!isMobile && (
        <>
          <div
            className="fixed w-3 h-3 bg-brand-volt rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out mix-blend-difference"
            style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px`, transform: `translate(-50%,-50%) scale(${isHovering ? 1.8 : 1})` }}
          />
          <div
            className="fixed w-10 h-10 border border-brand-volt/40 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out"
            style={{
              left: `${ringPos.x}px`, top: `${ringPos.y}px`,
              transform: `translate(-50%,-50%) scale(${isHovering ? 1.5 : 1})`,
              borderColor: isHovering ? 'rgba(200,241,53,0.7)' : 'rgba(200,241,53,0.3)',
            }}
          />
        </>
      )}

      <CardNav
        items={navItems}
        theme="dark"
        ease="back.out(1.5)"
        buttonBgColor="#00f0ff"
        buttonTextColor="#000000"
      />
      {/* Clears fixed CardNav with a modest gap below it */}
      <div className="pt-[90px]">
        <CTASection />
        <Features />
      </div>
    </div>
  );
}
