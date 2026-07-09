'use client';

import { useState, useEffect, useRef } from 'react';
import LandingNav from './landing/LandingNav';
import LandingHero from './landing/LandingHero';
import LandingTicker from './landing/LandingTicker';
import LandingDemo from './landing/LandingDemo';
import LandingFeatures from './landing/LandingFeatures';
import LandingTestimonials from './landing/LandingTestimonials';
import LandingPricing from './landing/LandingPricing';
import LandingFaq from './landing/LandingFaq';
import LandingCta from './landing/LandingCta';
import LandingFooter from './landing/LandingFooter';
import {
  useTypingEffect,
  useActionWord,
  useCountdown,
  useAnimatedPrice,
  useParticleCanvas,
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

  const canvasRef = useRef(null);
  const badgeText = useTypingEffect();
  const actionWord = useActionWord();
  const timeLeft = useCountdown();
  const priceDisplay = useAnimatedPrice(billingInterval);
  const { mousePos, ringPos, isHovering } = useCustomCursor(isMobile);
  useParticleCanvas(canvasRef);

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

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
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

      {/* Ambient background */}
      <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse-slow z-0" />
      <div className="absolute top-[40%] left-[5%] w-[450px] h-[450px] bg-brand-mint/4 rounded-full filter blur-[120px] pointer-events-none animate-spin-slow z-0" />
      <div className="absolute bottom-[15%] right-[5%] w-[350px] h-[350px] bg-brand-rose/4 rounded-full filter blur-[90px] pointer-events-none animate-pulse-slow z-0" />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-70" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      <div className="bg-grain" />

      {/* Page sections */}
      <LandingNav scrolled={scrolled} onEnterDemo={enterDemo} />
      <LandingHero badgeText={badgeText} actionWord={actionWord} scrollY={scrollY} onEnterDemo={enterDemo} />
      <LandingTicker />
      <LandingDemo onEnterDemo={enterDemo} />
      <LandingFeatures />
      <LandingTestimonials />
      <LandingPricing
        billingInterval={billingInterval}
        setBillingInterval={setBillingInterval}
        priceDisplay={priceDisplay}
        timeLeft={timeLeft}
        onStartTrial={handleStartTrial}
      />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
