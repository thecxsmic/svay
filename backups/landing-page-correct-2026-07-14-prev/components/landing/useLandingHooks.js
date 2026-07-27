'use client';

import { useState, useEffect, useRef } from 'react';
import { PRICING } from '../data/landingPricing';

// ─── Hero action word cycler ──────────────────────────────────────────────────
const ACTION_WORDS = ['record.', 'upload.', 'publish.', 'create.'];
export function useActionWord() {
  const [actionWord, setActionWord] = useState(ACTION_WORDS[0]);
  useEffect(() => {
    let idx = 0;
    const id = setInterval(() => {
      idx = (idx + 1) % ACTION_WORDS.length;
      setActionWord(ACTION_WORDS[idx]);
    }, 2500);
    return () => clearInterval(id);
  }, []);
  return actionWord;
}

// ─── Typing badge effect ──────────────────────────────────────────────────────
const BADGE_PHRASES = [
  'Real-Time Creator Intelligence',
  'AI-Powered Trend Detection',
  'Competitor Analysis Engine',
];
export function useTypingEffect() {
  const [badgeText, setBadgeText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = BADGE_PHRASES[phraseIdx];
    const speed = isDeleting ? 30 : 60;
    if (!isDeleting && charIdx === current.length) {
      const t = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(t);
    }
    if (isDeleting && charIdx === 0) {
      setIsDeleting(false);
      setPhraseIdx((p) => (p + 1) % BADGE_PHRASES.length);
      return;
    }
    const t = setTimeout(() => {
      setCharIdx((p) => p + (isDeleting ? -1 : 1));
      setBadgeText(current.substring(0, charIdx + (isDeleting ? -1 : 1)));
    }, speed);
    return () => clearTimeout(t);
  }, [charIdx, isDeleting, phraseIdx]);

  return badgeText;
}

// ─── Countdown timer (target: July 15, 2026) ─────────────────────────────────
export function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const target = new Date('2026-07-15T23:59:59Z').getTime();
    const calc = () => {
      const diff = target - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

// ─── Animated price counter ───────────────────────────────────────────────────
export function useAnimatedPrice(billingInterval) {
  const [priceDisplay, setPriceDisplay] = useState(PRICING.monthly);
  const prevRef = useRef(PRICING.monthly);

  useEffect(() => {
    const target = PRICING[billingInterval];
    const from = prevRef.current;
    if (from === target) return;
    let id;
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 800, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setPriceDisplay(Math.round(from + (target - from) * ease));
      if (p < 1) {
        id = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };
    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [billingInterval]);

  return priceDisplay;
}

// ─── Canvas particle background ───────────────────────────────────────────────
export function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], animId;

    const init = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      particles = Array.from({ length: Math.min(Math.floor(W / 15), 80) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        color: Math.random() < 0.7 ? '0, 240, 255' : '0, 82, 255',
        alpha: Math.random() * 0.2 + 0.05,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => {
        p.x = (p.x + p.vx + W) % W;
        p.y = (p.y + p.vy + H) % H;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0,240,255,${0.08 * (1 - d / 130)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };

    init();
    window.addEventListener('resize', init);
    draw();
    return () => { window.removeEventListener('resize', init); cancelAnimationFrame(animId); };
  }, [canvasRef]);
}

// ─── Custom cursor ────────────────────────────────────────────────────────────
export function useCustomCursor(isMobile) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isMobile) return;
    const onMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const addHover = () => {
      document.querySelectorAll('button,a,.interactive-card,[role="button"]').forEach((el) => {
        el.addEventListener('mouseenter', () => setIsHovering(true));
        el.addEventListener('mouseleave', () => setIsHovering(false));
      });
    };
    window.addEventListener('mousemove', onMove);
    addHover();
    const obs = new MutationObserver(addHover);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { window.removeEventListener('mousemove', onMove); obs.disconnect(); };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    let id;
    const follow = () => {
      setRingPos((prev) => ({
        x: prev.x + (mousePos.x - prev.x) * 0.12,
        y: prev.y + (mousePos.y - prev.y) * 0.12,
      }));
      id = requestAnimationFrame(follow);
    };
    id = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(id);
  }, [mousePos, isMobile]);

  return { mousePos, ringPos, isHovering };
}
