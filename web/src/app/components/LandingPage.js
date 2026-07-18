'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import CardNav from './landing/CardNav';
import { CTASection } from './ui/hero-dithering-card';
import { LandingAmbient } from '@/components/ui/landing-ambient';
import {
  useAnimatedPrice,
  useCountdown,
  useCustomCursor,
} from './landing/useLandingHooks';

// Below-fold sections — load after hero paints (faster LCP)
const Features = lazy(() =>
  import('@/components/ui/features-10').then((m) => ({ default: m.Features }))
);
const FreeToolsSection = lazy(() =>
  import('@/components/ui/free-tools-section').then((m) => ({
    default: m.FreeToolsSection,
  }))
);
const Pricing = lazy(() =>
  import('@/components/ui/pricing-section').then((m) => ({ default: m.Pricing }))
);
const GoCta = lazy(() =>
  import('@/components/ui/go-cta-section').then((m) => ({ default: m.GoCta }))
);
const LandingFooter = lazy(() =>
  import('@/components/ui/landing-footer').then((m) => ({ default: m.LandingFooter }))
);

function SectionFallback() {
  return <div className="min-h-[12rem] w-full" aria-hidden />;
}

const enterDemo = (e) => {
  if (e) e.preventDefault();
  document.cookie = 'demo_mode=true; path=/; max-age=31536000;';
  window.location.reload();
};

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [billingInterval, setBillingInterval] = useState('monthly');

  const { mousePos, ringPos, isHovering } = useCustomCursor(isMobile);
  const timeLeft = useCountdown();
  const priceDisplay = useAnimatedPrice(billingInterval);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleStartTrial = () => {
    document.cookie = `selected_plan=${billingInterval}; path=/; max-age=3600;`;
    window.location.href = '/sign-in';
  };

  const navItems = [
    {
      label: 'Product',
      bgColor: '#0d0d11',
      textColor: '#fff',
      links: [
        { label: 'Features', href: '#features', ariaLabel: 'SVAY Features' },
        { label: 'Pricing', href: '#pricing', ariaLabel: 'SVAY Pricing' },
        { label: 'Free Tools', href: '/tools', ariaLabel: 'Free creator tools' },
      ],
    },
    {
      label: 'Resources',
      bgColor: '#14141a',
      textColor: '#fff',
      links: [
        { label: 'Docs', href: '/docs', ariaLabel: 'SVAY Docs' },
        { label: 'Demo', href: '#', ariaLabel: 'Launch Demo', onClick: enterDemo },
      ],
    },
    {
      label: 'Portal',
      bgColor: '#25252e',
      textColor: '#fff',
      links: [
        { label: 'Sign In', href: '/sign-in', ariaLabel: 'Sign In' },
        {
          label: 'Start Trial',
          href: '/sign-in',
          ariaLabel: 'Start Trial',
          onClick: handleStartTrial,
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#030308] text-white">
      {/* SEO: visible landmark copy in first paint (matches hero H1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[10000] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>

      <LandingAmbient />

      {!isMobile && (
        <>
          <div
            className="pointer-events-none fixed z-[9999] h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400 mix-blend-difference transition-transform duration-100 ease-out"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              transform: `translate(-50%,-50%) scale(${isHovering ? 1.8 : 1})`,
            }}
          />
          <div
            className="pointer-events-none fixed z-[9998] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/35 transition-transform duration-300 ease-out"
            style={{
              left: `${ringPos.x}px`,
              top: `${ringPos.y}px`,
              transform: `translate(-50%,-50%) scale(${isHovering ? 1.5 : 1})`,
              borderColor: isHovering
                ? 'rgba(96,165,250,0.75)'
                : 'rgba(96,165,250,0.35)',
            }}
          />
        </>
      )}

      <CardNav
        items={navItems}
        theme="dark"
        ease="back.out(1.5)"
        buttonBgColor="#ffffff"
        buttonTextColor="#030308"
      />

      <main id="main-content" className="relative z-[2] pt-[90px]">
        <CTASection />
        <Suspense fallback={<SectionFallback />}>
          <Features />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FreeToolsSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Pricing
            billingInterval={billingInterval}
            setBillingInterval={setBillingInterval}
            priceDisplay={priceDisplay}
            timeLeft={timeLeft}
            onStartTrial={handleStartTrial}
          />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <GoCta onStartTrial={handleStartTrial} onLaunchDemo={enterDemo} />
        </Suspense>
        <Suspense fallback={null}>
          <LandingFooter onLaunchDemo={enterDemo} />
        </Suspense>
      </main>
    </div>
  );
}
