'use client';

import { useState, useEffect } from 'react';
import CardNav from './landing/CardNav';
import { CTASection } from './ui/hero-dithering-card';
import { Features } from '@/components/ui/features-10';
import { Pricing } from '@/components/ui/pricing-section';
import { GoCta } from '@/components/ui/go-cta-section';
import { LandingFooter } from '@/components/ui/landing-footer';
import { LandingAmbient } from '@/components/ui/landing-ambient';
import {
  useAnimatedPrice,
  useCountdown,
  useCustomCursor,
} from './landing/useLandingHooks';

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

      <div className="relative z-[2] pt-[90px]">
        <CTASection />
        <Features />
        <Pricing
          billingInterval={billingInterval}
          setBillingInterval={setBillingInterval}
          priceDisplay={priceDisplay}
          timeLeft={timeLeft}
          onStartTrial={handleStartTrial}
        />
        <GoCta onStartTrial={handleStartTrial} onLaunchDemo={enterDemo} />
        <LandingFooter onLaunchDemo={enterDemo} />
      </div>
    </div>
  );
}
