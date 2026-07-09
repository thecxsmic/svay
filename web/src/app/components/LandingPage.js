"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { 
  Zap, Target, TrendingUp, Search, Cpu, ArrowRight, Check, Play, Sparkles, 
  Clock, Star, ArrowUpRight, HelpCircle, ChevronDown, Monitor, 
  BarChart3, Users, BookOpen, 
  Menu, X
} from 'lucide-react';
import { SignIn } from '@clerk/nextjs';
import DemoLoginButton from './DemoLoginButton';

// Reusable scroll-reveal wrapper
const RevealOnScroll = ({ children, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Animated number counter component
const AnimatedCounter = ({ target, suffix = '', duration = 1500 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

export default function LandingPage() {
  
  const enterDemo = (e) => {
    if (e) e.preventDefault();
    document.cookie = "demo_mode=true; path=/; max-age=31536000;"; // 1 year
    window.location.reload();
  };

  const handleStartTrial = () => {
    document.cookie = `selected_plan=${billingInterval}; path=/; max-age=3600;`;
    window.location.href = "/sign-in";
  };

  // Navigation scroll state
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Custom cursor states
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ringPos, setRingPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);


  
  // Pricing counter states (animated)
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [priceDisplay, setPriceDisplay] = useState(999);

  
  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);
  
  // Countdown Timer states (Target: July 15, 2026)
  const [timeLeft, setTimeLeft] = useState({ days: 14, hours: 0, minutes: 0, seconds: 0 });

  // Typing effect for hero badge
  const badgePhrases = ['Real-Time Creator Intelligence', 'AI-Powered Trend Detection', 'Competitor Analysis Engine'];
  const [badgeText, setBadgeText] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hero loop text state
  const actionWords = ['record.', 'upload.', 'publish.', 'create.'];
  const [actionWord, setActionWord] = useState('record.');
  const [actionIdx, setActionIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActionIdx((prev) => {
        const next = (prev + 1) % actionWords.length;
        setActionWord(actionWords[next]);
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Parallax scroll state
  const [scrollY, setScrollY] = useState(0);

  // Refs for tilt card
  const heroCardRef = useRef(null);
  const [cardTransform, setCardTransform] = useState('');
  
  // Ref for canvas particle background
  const canvasRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Custom cursor handler
  useEffect(() => {
    if (isMobile) return;
    
    const onMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMouseMove);

    // Add hover states to interactables
    const addHoverListeners = () => {
      const elements = document.querySelectorAll('button, a, .interactive-card, [role="button"]');
      elements.forEach(el => {
        el.addEventListener('mouseenter', () => setIsHovering(true));
        el.addEventListener('mouseleave', () => setIsHovering(false));
      });
    };

    addHoverListeners();
    // Re-apply listeners if DOM updates
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      observer.disconnect();
    };
  }, [isMobile]);

  // Smooth ring follow effect
  useEffect(() => {
    if (isMobile) return;
    let animId;
    const followMouse = () => {
      setRingPos(prev => {
        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        return {
          x: prev.x + dx * 0.12,
          y: prev.y + dy * 0.12
        };
      });
      animId = requestAnimationFrame(followMouse);
    };
    animId = requestAnimationFrame(followMouse);
    return () => cancelAnimationFrame(animId);
  }, [mousePos, isMobile]);

  // Navigation scroll listener + parallax
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Typing effect cycle
  useEffect(() => {
    const currentPhrase = badgePhrases[phraseIdx];
    const speed = isDeleting ? 30 : 60;

    if (!isDeleting && charIdx === currentPhrase.length) {
      // Pause at end of phrase
      const timeout = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && charIdx === 0) {
      setIsDeleting(false);
      setPhraseIdx((prev) => (prev + 1) % badgePhrases.length);
      return;
    }

    const timeout = setTimeout(() => {
      setCharIdx((prev) => prev + (isDeleting ? -1 : 1));
      setBadgeText(currentPhrase.substring(0, charIdx + (isDeleting ? -1 : 1)));
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, phraseIdx]);

  // Countdown timer handler targeting July 15, 2026
  useEffect(() => {
    const targetDate = new Date("2026-07-15T23:59:59Z").getTime();
    
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = targetDate - now;
      
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Animate pricing when interval changes
  useEffect(() => {
    let startTime = null;
    const duration = 800; // ms
    const startPrice = priceDisplay;
    const targetPrice = billingInterval === "monthly" ? 999 : 699;
    
    if (startPrice === targetPrice) return;
    
    let animId;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startPrice + (targetPrice - startPrice) * ease);
      setPriceDisplay(current);
      
      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };
    
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [billingInterval]);


  // Canvas particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    let particles = [];
    
    const initCanvas = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      particles = [];
      const particleCount = Math.min(Math.floor(W / 15), 80);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.5,
          color: Math.random() < 0.7 ? '0, 240, 255' : '0, 82, 255', // Cyan or Blue
          alpha: Math.random() * 0.2 + 0.05
        });
      }
    };

    initCanvas();
    window.addEventListener('resize', initCanvas);

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      
      // Update & Draw particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.fill();
        
        // Connections
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const connectionAlpha = 0.08 * (1 - dist / 130);
            ctx.strokeStyle = `rgba(0, 240, 255, ${connectionAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      
      animId = requestAnimationFrame(draw);
    };
    
    draw();
    return () => {
      window.removeEventListener('resize', initCanvas);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Card 3D tilt effect handler
  const handleCardMouseMove = (e) => {
    const card = heroCardRef.current;
    if (!card) return;
    
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    const px = (e.clientX - cx) / (rect.width / 2); // -1 to 1
    const py = (e.clientY - cy) / (rect.height / 2); // -1 to 1
    
    const rotateX = py * -10; // degrees max
    const rotateY = px * 10;
    
    setCardTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleCardMouseLeave = () => {
    setCardTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Custom Pointer following ring (hidden on mobile) */}
      {!isMobile && (
        <>
          <div 
            className="fixed w-3 h-3 bg-brand-volt rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out mix-blend-difference"
            style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px`, transform: `translate(-50%, -50%) scale(${isHovering ? 1.8 : 1})` }}
          />
          <div 
            className="fixed w-10 h-10 border border-brand-volt/40 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 ease-out"
            style={{ 
              left: `${ringPos.x}px`, 
              top: `${ringPos.y}px`, 
              transform: `translate(-50%, -50%) scale(${isHovering ? 1.5 : 1})`,
              borderColor: isHovering ? 'rgba(200, 241, 53, 0.7)' : 'rgba(200, 241, 53, 0.3)'
            }}
          />
        </>
      )}

      {/* Floating blur orbs - Visual background accent */}
      <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse-slow z-0" />
      <div className="absolute top-[40%] left-[5%] w-[450px] h-[450px] bg-brand-mint/4 rounded-full filter blur-[120px] pointer-events-none animate-spin-slow z-0" />
      <div className="absolute bottom-[15%] right-[5%] w-[350px] h-[350px] bg-brand-rose/4 rounded-full filter blur-[90px] pointer-events-none animate-pulse-slow z-0" />

      {/* Dynamic particles and tech Grid overlay */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-70" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      {/* Background grain texture */}
      <div className="bg-grain" />

      {/* ── HEADER (GLASSMORPHIC FLOATING ISLAND) ── */}
      <header className="fixed top-0 left-0 right-0 w-full max-w-[100vw] z-50 px-3 sm:px-4 md:px-8 py-4 transition-all duration-300">
        <div className={`max-w-5xl w-full mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-0 lg:gap-4 rounded-2xl bg-black/85 border ${scrolled ? 'border-brand-volt/20 shadow-[0_8px_32px_rgba(0,240,255,0.05)]' : 'border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)]'} backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-200`}>
          <div className="flex items-center justify-between w-full lg:w-auto py-1">
            {/* Logo */}
            <a href="#" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 group">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-volt via-[#00b0ff] to-brand-mint shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] transition-all" />
              <span className="font-logo font-black text-lg text-white tracking-tight">SVAY</span>
            </a>

            {/* Hamburger menu button for mobile */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center p-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950/40 hover:bg-zinc-900 transition-all cursor-pointer focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Links */}
          <nav className={`${mobileMenuOpen ? 'flex' : 'hidden lg:flex'} flex-col lg:flex-row items-start lg:items-center gap-1.5 lg:gap-8 text-[11px] font-bold uppercase tracking-wider text-zinc-400 w-full lg:w-auto pt-4 pb-2 lg:py-0 border-t border-zinc-900/80 lg:border-t-0 mt-3 lg:mt-0`}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-2 px-3 lg:py-1 lg:px-0 w-full lg:w-auto rounded-xl hover:bg-white/5 lg:hover:bg-transparent relative group flex items-center">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-volt transition-all group-hover:w-full hidden lg:block" />
            </a>
            <button onClick={(e) => { setMobileMenuOpen(false); enterDemo(e); }} className="hover:text-white text-left transition-colors py-2 px-3 lg:py-1 lg:px-0 w-full lg:w-auto rounded-xl hover:bg-white/5 lg:hover:bg-transparent relative group flex items-center font-bold uppercase tracking-wider text-zinc-400 text-[11px] cursor-pointer">
              Launch Demo
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-volt transition-all group-hover:w-full hidden lg:block" />
            </button>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-2 px-3 lg:py-1 lg:px-0 w-full lg:w-auto rounded-xl hover:bg-white/5 lg:hover:bg-transparent relative group flex items-center">
              Pricing
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-volt transition-all group-hover:w-full hidden lg:block" />
            </a>
            <a href="/docs" onClick={() => setMobileMenuOpen(false)} className="hover:text-white transition-colors py-2 px-3 lg:py-1 lg:px-0 w-full lg:w-auto rounded-xl hover:bg-white/5 lg:hover:bg-transparent relative group flex items-center">
              Docs
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-volt transition-all group-hover:w-full hidden lg:block" />
            </a>
          </nav>

          {/* Action Button */}
          <div className={`${mobileMenuOpen ? 'flex' : 'hidden lg:flex'} flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto pt-3 pb-1 lg:py-0 border-t border-zinc-900/80 lg:border-t-0 mt-2 lg:mt-0`}>
            <button 
              onClick={() => { setMobileMenuOpen(false); window.location.href = "/sign-in"; }} 
              className="px-5 py-3 lg:py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-extrabold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer text-center"
            >
              Sign In
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); window.location.href = "/sign-in"; }} 
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-[11px] font-bold uppercase tracking-wider text-black rounded-xl group bg-gradient-to-br from-brand-volt to-brand-mint group-hover:from-brand-volt group-hover:to-brand-mint hover:text-black focus:ring-4 focus:outline-none focus:ring-lime-800 transition-all duration-300 w-full lg:w-auto cursor-pointer"
            >
              <span className="relative px-5 py-2.5 lg:py-2 transition-all ease-in duration-75 bg-brand-volt rounded-xl group-hover:bg-opacity-0 group-hover:text-white text-black font-extrabold flex items-center justify-center gap-1.5 w-full lg:w-auto">
                Start Trial <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 pt-32 pb-24 md:pt-40 md:pb-36 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-6 lg:gap-8 items-center">
        {/* Hero Info */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-col items-start text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-volt/10 border border-brand-volt/20 px-3.5 py-1.5 rounded-full mb-8 shadow-[0_0_15px_rgba(0,240,255,0.03)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-volt opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-volt"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-volt">{badgeText}<span className="animate-pulse">|</span></span>
          </div>

          {/* Main Title */}
          <h1 className="font-display font-extrabold text-5xl md:text-4xl lg:text-5xl xl:text-7xl leading-[1.0] tracking-tight text-white mb-4 md:mb-6">
            Know what performs.<br/>
            Before you hit<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052ff] via-[#00d2ff] to-[#7c3aed] drop-shadow-[0_0_15px_rgba(0,240,255,0.1)] text-glow-volt inline-flex min-w-[200px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={actionWord}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {actionWord}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Description */}
          <p className="text-zinc-400 text-base md:text-xs lg:text-sm xl:text-base leading-relaxed max-w-xl mb-6 md:mb-8 xl:mb-10 font-normal">
            Stop guessing what your audience wants. Svay tracks your competitors' top-performing formats, catches breakout topics as they begin to spike, and helps you structure video ideas backed by real demand data.
          </p>

          {/* Action Buttons & Social Proof */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full">
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <button 
                onClick={() => { window.location.href = "/sign-in"; }}
                className="px-6 md:px-5 lg:px-8 py-3 md:py-2.5 lg:py-4 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-sm md:text-xs lg:text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_30px_rgba(0,240,255,0.25)] hover:shadow-[0_0_40px_rgba(0,240,255,0.45)] hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={enterDemo}
                className="px-6 md:px-5 lg:px-8 py-3 md:py-2.5 lg:py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-extrabold text-sm md:text-xs lg:text-sm uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 hover:-translate-y-0.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" /> See Demo
              </button>
            </div>

            {/* Social Proof Avatar Stack */}
            <div className="flex items-center gap-3 select-none pl-1 sm:pl-4 sm:border-l sm:border-zinc-800">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80",
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="Creator Avatar"
                    className="w-7 h-7 rounded-full border-2 border-black object-cover relative z-10"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5 text-brand-volt fill-brand-volt" />
                  ))}
                </div>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
                  Trusted by <span className="text-white font-black">1,200+ creators</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats banner */}
          <div className="mt-8 md:mt-4 lg:mt-6 xl:mt-12 pt-6 md:pt-3 lg:pt-4 xl:pt-8 border-t border-zinc-900 w-full grid grid-cols-3 gap-4 md:gap-2 lg:gap-3 xl:gap-6 text-left">
            <div>
              <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight"><AnimatedCounter target={48} suffix="K+" /></p>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider font-bold">High-Growth Channels Monitored</p>
            </div>
            <div>
              <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight">Hourly</p>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Breakout Trend Scans</p>
            </div>
            <div>
              <p className="font-mono text-xl md:text-base lg:text-lg xl:text-2xl font-bold text-white tracking-tight"><AnimatedCounter target={50} suffix="+" /></p>
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Content Niches Tracked</p>
            </div>
          </div>
        </div>

        {/* Hero Visual Card (3D Tilt Widget) */}
        <div className="md:col-span-6 lg:col-span-5 flex items-center justify-center relative">
          <div 
            ref={heroCardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            className="w-full max-w-[360px] lg:max-w-[420px] rounded-3xl p-5 lg:p-6 bg-zinc-950/80 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden transition-all duration-200"
            style={{ 
              transform: cardTransform,
              boxShadow: '0 30px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 50px rgba(0,240,255,0.04)'
            }}
          >
            {/* Top decorative accent bar */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-volt to-brand-mint opacity-85" />
            
            {/* Header info */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-volt animate-ping" />
                <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Growth Analytics</span>
              </div>
              <span className="font-mono text-[9px] font-black text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-2.5 py-1 rounded-md uppercase tracking-wider">LIVE ACTIVE</span>
            </div>

            {/* Channels metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-2xl relative overflow-hidden group hover:border-brand-volt/30 transition-all hover:bg-zinc-900/30">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Subscriber Net</p>
                <div>
                  <p className="font-display font-extrabold text-2xl text-white">48,250</p>
                  <span className="inline-block mt-1.5 text-[8px] font-black font-mono text-brand-volt bg-brand-volt/10 border border-brand-volt/20 px-1.5 py-0.5 rounded">↑ +2.1%</span>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand-volt/[0.02] rounded-tl-2xl" />
              </div>
              
              <div className="bg-zinc-900/20 border border-zinc-800/60 p-4 rounded-2xl relative overflow-hidden group hover:border-brand-mint/30 transition-all hover:bg-zinc-900/30">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Virality Index</p>
                <div>
                  <p className="font-display font-extrabold text-2xl text-white">92.4</p>
                  <span className="inline-block mt-1.5 text-[8px] font-black font-mono text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-1.5 py-0.5 rounded">HOT</span>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-brand-mint/[0.02] rounded-tl-2xl" />
              </div>
            </div>

            {/* Glowing Chart Simulation */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Weekly View Volume</span>
                <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/40">Total: 3.4M</span>
              </div>
              <div className="h-28 flex items-end justify-between gap-1.5 pt-4 pb-2 relative border-b border-zinc-900/60 overflow-hidden rounded-lg bg-zinc-950/40 px-2">
                {/* Simulated Gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 py-4">
                  <div className="w-full border-t border-white" />
                  <div className="w-full border-t border-white" />
                  <div className="w-full border-t border-white" />
                </div>
                {/* Simulated Chart Bars with scaling delays */}
                {[30, 48, 35, 62, 55, 75, 68, 88, 98, 72, 85, 95].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative z-10">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-volt text-black text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                      +{val}%
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-full bg-gradient-to-t from-brand-volt/10 via-brand-volt/40 to-brand-volt group-hover:from-brand-volt/20 group-hover:to-[#33f3ff] rounded-t-[3px] transition-all duration-500 cursor-pointer origin-bottom shadow-[0_0_10px_rgba(0,240,255,0.15)] group-hover:shadow-[0_0_15px_rgba(0,240,255,0.35)]"
                      style={{ 
                        height: `${val}%`, 
                        animationDelay: `${idx * 0.05}s`
                      }} 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Hot topics block */}
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Topic Velocity Alerts</p>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800 transition-all hover:bg-zinc-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs shadow-inner">🔥</div>
                  <div>
                    <p className="text-xs font-black text-white">AI Agents 2026</p>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Scraped 3m ago · Tech</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-black text-brand-rose bg-brand-rose/10 border border-brand-rose/25 px-2.5 py-0.5 rounded-md uppercase tracking-wider">VIRAL</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800 transition-all hover:bg-zinc-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-volt/10 border border-brand-volt/20 flex items-center justify-center text-xs shadow-inner">🚀</div>
                  <div>
                    <p className="text-xs font-black text-white">Milvus Vector Database</p>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Scraped 15m ago · Dev</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-black text-brand-volt bg-brand-volt/10 border border-brand-volt/25 px-2.5 py-0.5 rounded-md uppercase tracking-wider">+147%</span>
              </div>
            </div>
          </div>

          {/* Layered floating metric badge 1 (Top-Right) */}
          <div 
            className="hidden lg:flex items-center gap-2.5 p-3.5 rounded-full bg-zinc-950/90 border border-brand-volt/20 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] absolute -top-6 lg:-right-2 xl:-right-16 scale-90 xl:scale-100 z-25 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-volt/40"
            style={{ transform: `translateY(${scrollY * -0.06}px)` }}
          >
            <div className="w-6 h-6 rounded-full bg-brand-volt/10 flex items-center justify-center text-xs">📈</div>
            <div>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest leading-none">Niche Gap</p>
              <p className="text-[10px] font-black text-white leading-none mt-1">+28.4% CPM</p>
            </div>
          </div>

          {/* Layered floating audit card 2 (Bottom-Right) */}
          <div 
            className="hidden lg:flex flex-col gap-3 p-4.5 rounded-2xl bg-zinc-950/90 border border-brand-mint/20 shadow-[0_20px_40px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)] absolute -bottom-10 lg:-right-2 xl:-right-8 w-52 scale-90 xl:scale-100 z-25 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-brand-mint/40 text-left"
            style={{ transform: `translateY(${scrollY * 0.04}px)` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Competitor DNA</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse" />
            </div>
            <div>
              <p className="text-[8px] text-zinc-500 uppercase font-black tracking-wider leading-none">Velocity Score</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-display font-extrabold text-white">88.2</span>
                <span className="text-[8px] font-bold text-brand-mint">↑ +14%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[7px] font-mono text-zinc-500 leading-none">
                <span>QUEUE</span>
                <span>94%</span>
              </div>
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full bg-brand-mint rounded-full shadow-[0_0_8px_#00ffca]" style={{ width: '94%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE INTERACTIVE SCALING TICKER ── */}
      <section className="border-y border-zinc-900 bg-black/40 backdrop-blur-sm py-4 overflow-hidden relative z-10">
        <div className="marquee-track flex gap-16 whitespace-nowrap flex-row w-max">
          <div className="flex gap-16 text-zinc-500 font-mono text-[11px] font-bold uppercase tracking-wider">
            <span>🚀 <strong className="text-brand-volt">48,200+</strong> channels analyzed today</span>
            <span>✦</span>
            <span>⚡ <strong className="text-white">Breakout Alerts</strong> updated hourly</span>
            <span>✦</span>
            <span>📊 <strong className="text-brand-mint">3.4M+</strong> performance metrics tracked</span>
            <span>✦</span>
            <span>🔥 <strong className="text-brand-rose">Competitor Matrix</strong> 50+ content verticals decoded</span>
            <span>✦</span>
            <span>🎯 <strong className="text-white">Semantic search</strong> active</span>
          </div>
          <div className="flex gap-16 text-zinc-500 font-mono text-[11px] font-bold uppercase tracking-wider">
            <span>🚀 <strong className="text-brand-volt">48,200+</strong> channels analyzed today</span>
            <span>✦</span>
            <span>⚡ <strong className="text-white">Breakout Alerts</strong> updated hourly</span>
            <span>✦</span>
            <span>📊 <strong className="text-brand-mint">3.4M+</strong> performance metrics tracked</span>
            <span>✦</span>
            <span>🔥 <strong className="text-brand-rose">Competitor Matrix</strong> 50+ content verticals decoded</span>
            <span>✦</span>
            <span>🎯 <strong className="text-white">Semantic search</strong> active</span>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO PREVIEW (ENTER DEMO ACCOUNT CONSOLE) ── */}
      <section id="demo" className="relative z-10 py-24 px-4 md:px-8 max-w-5xl mx-auto scroll-mt-20">
        <RevealOnScroll>
        <div className="rounded-[2.5rem] border border-white/[0.08] bg-zinc-950/60 shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden p-8 md:p-14 relative group">
          {/* Accent lighting */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-volt to-transparent opacity-70" />
          <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[80px] pointer-events-none group-hover:bg-brand-volt/10 transition-colors duration-700" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Info side */}
            <div className="md:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-volt/10 border border-brand-volt/20 px-3.5 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5 text-brand-volt" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-volt">Zero-friction preview</span>
              </div>
              
              <h2 className="font-display font-extrabold text-3.5xl md:text-5.5xl tracking-tight text-white leading-none uppercase">
                Test-drive the<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052ff] via-[#00d2ff] to-[#7c3aed] text-glow-volt">
                  <span className="font-logo">Svay</span> Workspace.
                </span>
              </h2>
              
              <p className="text-zinc-400 text-sm leading-relaxed max-w-lg font-normal">
                See the intelligence engine in action without sharing credentials or linking your account. Launch our interactive sandbox instantly to explore competitor insights, query real-time trend scoring, and see how reports are structured.
              </p>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">What's in the sandbox:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Live radar & breakout alerts",
                    "Simulated channel benchmarks",
                    "Semantic search sandbox",
                    "Competitor performance grids"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs text-zinc-350">
                      <div className="w-4 h-4 rounded-full bg-brand-volt/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-brand-volt" />
                      </div>
                      <span className="font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={enterDemo}
                  className="px-8 py-4 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_30px_rgba(0,240,255,0.15)] hover:shadow-[0_0_40px_rgba(0,240,255,0.35)] hover:-translate-y-0.5 text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Monitor className="w-4 h-4" /> Enter Sandbox
                </button>
                <a
                  href="#pricing"
                  className="px-8 py-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  Pro Plans
                </a>
              </div>
            </div>

            {/* Graphic side */}
            <div className="md:col-span-5 relative flex items-center justify-center">
              <div 
                className="w-full aspect-[4/3] rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-5 flex flex-col justify-between relative overflow-hidden group/console backdrop-blur-xl"
                style={{
                  boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
              >
                {/* Header Window Bar */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    {/* Window Controls */}
                    <div className="flex gap-1.5 mr-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                    </div>
                    <span className="font-mono text-[9px] text-zinc-500 font-bold uppercase tracking-wider">demo@svay.space:~</span>
                  </div>
                  <span className="text-[8px] font-bold text-zinc-650 uppercase tracking-widest font-mono">Console V3.0</span>
                </div>

                {/* Simulated Terminal Output */}
                <div className="flex-1 space-y-4 text-left">
                  {/* Metric Cell 1 */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 flex items-center justify-between hover:border-brand-volt/20 transition-all">
                    <div>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Subscriber count</p>
                      <p className="font-mono text-xl font-extrabold text-white">124,500</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-2 py-0.5 rounded-md">
                      +1.8K today
                    </span>
                  </div>

                  {/* Metric Cell 2 */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-2.5 hover:border-brand-volt/20 transition-all">
                    <div className="flex justify-between items-center">
                      <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Active Radar Scans</p>
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-volt opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-volt"></span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden p-[1px] border border-zinc-900">
                      <div className="h-full bg-gradient-to-r from-brand-volt to-brand-mint rounded-full animate-pulse shadow-[0_0_8px_#00f0ff]" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>

                {/* Footer status badges */}
                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5 bg-zinc-900/40 px-2.5 py-1 rounded-lg border border-zinc-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-volt shadow-[0_0_6px_#00f0ff]" />
                    <span>Sandbox Connection</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-900/40 px-2.5 py-1 rounded-lg border border-zinc-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse shadow-[0_0_6px_#00ffca]" />
                    <span>System Active</span>
                  </div>
                </div>

                {/* Decorative border glow */}
                <div className="absolute inset-0 border border-brand-volt/0 group-hover/console:border-brand-volt/10 rounded-2xl transition-colors duration-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
        </RevealOnScroll>
      </section>

      {/* ── CORE CAPABILITIES (FEATURES GRID) ── */}
      <section id="features" className="relative z-10 py-24 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-20">
        {/* Title */}
        <RevealOnScroll>
        <div className="max-w-3xl mb-16 text-left">
          <div className="inline-flex items-center gap-2 bg-brand-volt/10 border border-brand-volt/20 px-3.5 py-1.5 rounded-full mb-4">
            <Cpu className="w-3.5 h-3.5 text-brand-volt" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-volt">Core Capabilities</span>
          </div>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-white mb-6">
            Find your next viral topic.<br/>Backed by <em className="text-brand-volt not-italic text-glow-volt">performance data</em>.
          </h2>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-lg">
            Move past basic view counters. Svay maps the actual momentum, formatting, and keyword relationships driving successful channels in your space.
          </p>
        </div>
        </RevealOnScroll>

        {/* Feature Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: col-span-2 (Analytics & Tracking) */}
          <RevealOnScroll delay={0}>
          <div className="interactive-card group relative p-8 rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-brand-volt/30 transition-all duration-300 hover:-translate-y-1 md:col-span-2 overflow-hidden flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-volt/5 rounded-bl-full pointer-events-none group-hover:bg-brand-volt/8 transition-all duration-500 filter blur-xl" />
            <div>
              <span className="font-mono text-[9px] font-extrabold text-zinc-500 group-hover:text-brand-volt transition-colors uppercase tracking-widest block mb-4">01 // VELOCITY TRACKING</span>
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="space-y-3 flex-1 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl group-hover:border-brand-volt/30 group-hover:bg-zinc-950 transition-colors">
                    <BarChart3 className="w-5 h-5 text-brand-volt" />
                  </div>
                  <h3 className="font-display font-extrabold text-xl text-white">Analytics & Tracking</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-normal">
                    Monitor views and upload habits across your niche. Receive clear insights on subscriber growth trends and channel milestones without constantly checking analytics.
                  </p>
                </div>
                {/* Visual mockup inside card */}
                <div className="w-full lg:w-48 bg-black/40 border border-zinc-900 rounded-xl p-3.5 space-y-2 shrink-0 text-[8px] font-mono text-left">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-zinc-500 uppercase font-black">Velocity Stat</span>
                    <span className="text-brand-volt font-black">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Views</span>
                    <span className="text-white font-extrabold">3.4M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Net Growth</span>
                    <span className="text-brand-volt font-extrabold">+14.2%</span>
                  </div>
                  <div className="h-1 bg-zinc-900 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-brand-volt rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {['Growth trends', 'Projections', 'Milestones'].map(t => (
                <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/[0.04] px-2.5 py-1 rounded bg-black/40">{t}</span>
              ))}
            </div>
          </div>
          </RevealOnScroll>

          {/* Card 2: col-span-1 (Trend Radar) */}
          <RevealOnScroll delay={0.1}>
          <div className="interactive-card group relative p-8 rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-brand-rose/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-rose/5 rounded-bl-full pointer-events-none group-hover:bg-brand-rose/8 transition-all duration-500 filter blur-xl" />
            <div>
              <span className="font-mono text-[9px] font-extrabold text-zinc-500 group-hover:text-brand-rose transition-colors uppercase tracking-widest block mb-4">02 // EARLY DETECTION</span>
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl mb-6 group-hover:border-brand-rose/30 group-hover:bg-zinc-950 transition-colors">
                <Zap className="w-5 h-5 text-brand-rose" />
              </div>
              <h3 className="font-display font-extrabold text-xl text-white mb-3 text-left">Trend Radar</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-normal text-left">
                Detect rising search queries and tags early. Spot spikes in audience demand so you can outline videos before topics saturate.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {['Spike alerts', 'Breakout tags', 'Video outlines'].map(t => (
                <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/[0.04] px-2.5 py-1 rounded bg-black/40">{t}</span>
              ))}
            </div>
          </div>
          </RevealOnScroll>

          {/* Card 3: col-span-1 (Competitor Matrix) */}
          <RevealOnScroll delay={0.2}>
          <div className="interactive-card group relative p-8 rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-brand-mint/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-mint/5 rounded-bl-full pointer-events-none group-hover:bg-brand-mint/8 transition-all duration-500 filter blur-xl" />
            <div>
              <span className="font-mono text-[9px] font-extrabold text-zinc-500 group-hover:text-brand-mint transition-colors uppercase tracking-widest block mb-4">03 // INTEL</span>
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl mb-6 group-hover:border-brand-mint/30 group-hover:bg-zinc-950 transition-colors">
                <Users className="w-5 h-5 text-brand-mint" />
              </div>
              <h3 className="font-display font-extrabold text-xl text-white mb-3 text-left">Competitor Matrix</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-normal text-left">
                Compare your channel with direct competitors. Benchmark upload frequency, formats, and find what drives views.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {['Format mapping', 'Benchmarks', 'Performance ratios'].map(t => (
                <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/[0.04] px-2.5 py-1 rounded bg-black/40">{t}</span>
              ))}
            </div>
          </div>
          </RevealOnScroll>

          {/* Card 4: col-span-1 (Advanced Filtering) */}
          <RevealOnScroll delay={0.3}>
          <div className="interactive-card group relative p-8 rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-brand-rose/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-rose/5 rounded-bl-full pointer-events-none group-hover:bg-brand-rose/8 transition-all duration-500 filter blur-xl" />
            <div>
              <span className="font-mono text-[9px] font-extrabold text-zinc-500 group-hover:text-brand-rose transition-colors uppercase tracking-widest block mb-4">04 // FILTERING</span>
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl mb-6 group-hover:border-brand-rose/30 group-hover:bg-zinc-950 transition-colors">
                <Search className="w-5 h-5 text-brand-rose" />
              </div>
              <h3 className="font-display font-extrabold text-xl text-white mb-3 text-left">Advanced Search</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-normal text-left">
                Filter uploads by duration, location, and date. Sort by our virality score to find videos that resonated.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {['Virality factor', 'Format filter', 'Precision search'].map(t => (
                <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/[0.04] px-2.5 py-1 rounded bg-black/40">{t}</span>
              ))}
            </div>
          </div>
          </RevealOnScroll>

          {/* Card 5: col-span-1 (Research Notebook) */}
          <RevealOnScroll delay={0.4}>
          <div className="interactive-card group relative p-8 rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-brand-volt/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-volt/5 rounded-bl-full pointer-events-none group-hover:bg-brand-volt/8 transition-all duration-500 filter blur-xl" />
            <div>
              <span className="font-mono text-[9px] font-extrabold text-zinc-500 group-hover:text-brand-volt transition-colors uppercase tracking-widest block mb-4">05 // WORKSPACE</span>
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl mb-6 group-hover:border-brand-volt/30 group-hover:bg-zinc-950 transition-colors">
                <BookOpen className="w-5 h-5 text-brand-volt" />
              </div>
              <h3 className="font-display font-extrabold text-xl text-white mb-3 text-left">Research Notebook</h3>
              <p className="text-zinc-400 text-xs leading-relaxed font-normal text-left">
                Save key insights, high-momentum topics, and competitor references. Draft outlines in a dedicated notebook.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {['Topic folders', 'Markdown notes', 'Title drafts'].map(t => (
                <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/[0.04] px-2.5 py-1 rounded bg-black/40">{t}</span>
              ))}
            </div>
          </div>
          </RevealOnScroll>

          {/* Card 6: col-span-3 (Smart Digests) */}
          <RevealOnScroll delay={0.5}>
          <div className="interactive-card group relative p-8 rounded-3xl bg-zinc-950/60 border border-white/[0.08] hover:border-brand-mint/30 transition-all duration-300 hover:-translate-y-1 md:col-span-3 overflow-hidden flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-mint/5 rounded-bl-full pointer-events-none group-hover:bg-brand-mint/8 transition-all duration-500 filter blur-2xl" />
            <div>
              <span className="font-mono text-[9px] font-extrabold text-zinc-500 group-hover:text-brand-mint transition-colors uppercase tracking-widest block mb-4">06 // DIGESTS</span>
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="space-y-3 flex-1 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl group-hover:border-brand-mint/30 group-hover:bg-zinc-950 transition-colors">
                    <Cpu className="w-5 h-5 text-brand-mint" />
                  </div>
                  <h3 className="font-display font-extrabold text-xl text-white">Smart Notifications</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed font-normal">
                    Get competitor digests and tag updates sent directly to your inbox. Stay updated on market changes without needing to open the workspace.
                  </p>
                </div>
                {/* Visual email mockup */}
                <div className="w-full lg:w-64 bg-black/40 border border-zinc-900 rounded-xl p-3.5 space-y-2 shrink-0 text-left font-sans shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-1.5 text-[8px] font-mono text-zinc-500">
                    <span>From: intelligence@svay.space</span>
                    <span>Just now</span>
                  </div>
                  <h4 className="text-[10px] font-extrabold text-white">Weekly Competitor Matrix Alert</h4>
                  <p className="text-[8px] text-zinc-400 leading-normal">
                    🔥 <span className="text-brand-rose font-bold">AI Agents</span> format has spiked by <strong>+147%</strong> views this week. We recommend outlining a draft immediately.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              {['Email updates', 'Breakout summaries', 'Custom timing'].map(t => (
                <span key={t} className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/[0.04] px-2.5 py-1 rounded bg-black/40">{t}</span>
              ))}
            </div>
          </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── CREATOR TESTIMONIALS (SOCIAL PROOF) ── */}
      <section className="relative z-10 py-16 px-4 md:px-8 max-w-5xl mx-auto">
        <RevealOnScroll>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-rose/10 border border-brand-rose/20 px-3.5 py-1.5 rounded-full mb-4">
            <Users className="w-3.5 h-3.5 text-brand-rose" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-rose">Creator Feedback</span>
          </div>
          <h2 className="font-display font-extrabold text-3.5xl md:text-4.5xl tracking-tight text-white mb-4">
            What creators are saying
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto font-normal">
            Hear from channels utilizing Svay to optimize their workflow.
          </p>
        </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RevealOnScroll delay={0.1}>
          <div className="p-6 rounded-3xl bg-zinc-950/60 border border-white/[0.08] backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-brand-volt/20 transition-all duration-300 shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 right-0 p-4 text-brand-volt opacity-5 group-hover:opacity-10 transition-opacity">
              <Star className="w-12 h-12 fill-brand-volt" />
            </div>
            <p className="text-zinc-350 text-xs md:text-sm leading-relaxed font-normal italic mb-6 text-left">
              "Before using Svay, our team was spending 10+ hours a week manually scraping competitor uploads. Now, we spot rising concepts in 5 minutes and outline our video pipeline with hard demand data. It's completely transformed our production rate."
            </p>
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
                alt="Creator Profile"
                className="w-10 h-10 rounded-full object-cover border border-zinc-800"
              />
              <div className="text-left">
                <p className="text-xs font-black text-white">Sarah Jenkins</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Tech Reviewer · 340K subs</p>
              </div>
            </div>
          </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.2}>
          <div className="p-6 rounded-3xl bg-zinc-950/60 border border-white/[0.08] backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-brand-mint/20 transition-all duration-300 shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
            <div className="absolute top-0 right-0 p-4 text-brand-mint opacity-5 group-hover:opacity-10 transition-opacity">
              <Star className="w-12 h-12 fill-brand-mint" />
            </div>
            <p className="text-zinc-350 text-xs md:text-sm leading-relaxed font-normal italic mb-6 text-left">
              "We used to rely purely on gut feeling for titles and topics. Svay's Virality Index showed us exactly what format gaps we were missing. We locked in our early adopter price and it's already paid for itself 10x over."
            </p>
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80"
                alt="Creator Profile"
                className="w-10 h-10 rounded-full object-cover border border-zinc-800"
              />
              <div className="text-left">
                <p className="text-xs font-black text-white">David Chen</p>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Productivity Hacks · 1.2M subs</p>
              </div>
            </div>
          </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── METALLIC PRICING (HIGH CONVERTING SaaS CARD) ── */}
      <section id="pricing" className="relative z-10 py-20 px-4 md:px-8 max-w-5xl mx-auto scroll-mt-20">
        <RevealOnScroll>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-volt/10 border border-brand-volt/20 px-3.5 py-1.5 rounded-full mb-4">
            <Star className="w-3.5 h-3.5 text-brand-volt fill-brand-volt" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-volt">Simple Pricing</span>
          </div>
          <h2 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight text-white mb-4">
            One simple plan. Full access.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
            Try it free for 7 days. Cancel with a single click at any time.
          </p>

          {/* Pricing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-zinc-950/60 border border-zinc-800/80 p-1.5 rounded-2xl inline-flex gap-1 relative backdrop-blur-md shadow-inner">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 cursor-pointer ${
                  billingInterval === "monthly" ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                Monthly
                {billingInterval === "monthly" && (
                  <motion.div
                    layoutId="activeBillingPill"
                    className="absolute inset-0 bg-brand-volt rounded-xl -z-10 shadow-[0_4px_20px_rgba(0,240,255,0.25)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 relative z-10 flex items-center gap-2 cursor-pointer ${
                  billingInterval === "yearly" ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                Yearly
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-wide transition-colors ${
                  billingInterval === "yearly" 
                    ? "bg-zinc-950/10 text-zinc-950" 
                    : "bg-brand-rose/15 text-brand-rose border border-brand-rose/20"
                }`}>
                  Save 30%
                </span>
                {billingInterval === "yearly" && (
                  <motion.div
                    layoutId="activeBillingPill"
                    className="absolute inset-0 bg-brand-volt rounded-xl -z-10 shadow-[0_4px_20px_rgba(0,240,255,0.25)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
        </RevealOnScroll>

        {/* early adopter banner */}
        <RevealOnScroll delay={0.1}>
        <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/60 backdrop-blur-xl overflow-hidden relative mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]">
          {/* Ambient Glows */}
          <div className="absolute -left-16 -top-16 w-36 h-36 bg-brand-rose/8 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute -right-16 -bottom-16 w-36 h-36 bg-brand-volt/5 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-rose/[0.01] rounded-bl-full pointer-events-none" />
          
          <div className="p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="bg-brand-rose/10 border border-brand-rose/25 text-brand-rose text-[9px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase flex items-center gap-1.5 shrink-0 select-none shadow-[0_0_15px_rgba(255,79,109,0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-rose animate-pulse" />
                <span>Launch Offer</span>
              </div>
              <div className="text-left">
                <h3 className="font-display font-extrabold text-xl md:text-2xl text-white tracking-tight uppercase leading-tight">
                  Lock in early adopter pricing for life
                </h3>
                <p className="text-xs text-zinc-400 mt-2 max-w-xl font-normal leading-relaxed">
                  Secure your <strong className="text-white font-extrabold">{billingInterval}</strong> rate before we introduce multi-tier pricing. Your rate will never increase, even as features are added.
                </p>
              </div>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-4 bg-black/40 border border-white/[0.06] p-3 md:p-4 rounded-2xl shrink-0 w-full lg:w-auto justify-between lg:justify-start shadow-inner backdrop-blur-md">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none font-bold">Offer ends in</span>
              <div className="flex items-center gap-3 font-mono font-bold text-sm">
                {/* Days */}
                <div className="flex flex-col items-center min-w-[28px]">
                  <span className="text-base md:text-lg text-brand-volt text-glow-volt leading-none">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">days</span>
                </div>
                <span className="text-zinc-700 font-sans text-sm pb-3.5 leading-none select-none">:</span>
                {/* Hours */}
                <div className="flex flex-col items-center min-w-[28px]">
                  <span className="text-base md:text-lg text-brand-volt text-glow-volt leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">hours</span>
                </div>
                <span className="text-zinc-700 font-sans text-sm pb-3.5 leading-none select-none">:</span>
                {/* Minutes */}
                <div className="flex flex-col items-center min-w-[28px]">
                  <span className="text-base md:text-lg text-brand-volt text-glow-volt leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">mins</span>
                </div>
                <span className="text-zinc-700 font-sans text-sm pb-3.5 leading-none select-none">:</span>
                {/* Seconds */}
                <div className="flex flex-col items-center min-w-[28px]">
                  <span className="text-base md:text-lg text-brand-rose leading-none font-black animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-wider mt-1.5">secs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </RevealOnScroll>

        {/* Pricing Card */}
        <RevealOnScroll delay={0.2}>
        <div className="rounded-3xl border border-brand-volt/20 bg-zinc-950/70 backdrop-blur-md overflow-hidden relative grid grid-cols-1 md:grid-cols-12 gap-8 p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.8),0_0_50px_rgba(0,240,255,0.02)]">
          {/* Top highlight bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-volt to-brand-mint" />
          
          {/* Left Pricing Panel */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="flex items-center gap-2 text-brand-volt font-black uppercase text-[10px] tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-volt" /> Svay Pro {billingInterval === "yearly" ? "Yearly" : "Monthly"}
                </div>
                <span className="bg-brand-volt/10 border border-brand-volt/20 text-brand-volt font-black text-[8px] px-2 py-0.5 rounded-full tracking-wide uppercase select-none">Early Adopter Rate Lock</span>
              </div>
              
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="font-display font-extrabold text-3xl text-zinc-500">₹</span>
                <span className="font-display font-extrabold text-6xl md:text-7.5xl text-white tracking-tighter transition-all">
                  {priceDisplay}
                </span>
                <span className="font-mono text-zinc-500 text-xs font-bold">/ month</span>
              </div>

              {/* strike price & clarity info */}
              <div className="flex flex-col gap-1.5 mb-6 text-left">
                <div className="flex items-center gap-2">
                  {billingInterval === "monthly" ? (
                    <>
                      <span className="text-zinc-500 line-through text-sm font-bold">₹1,499/mo</span>
                      <span className="bg-brand-rose/15 text-brand-rose border border-brand-rose/25 font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">SAVE 33%</span>
                    </>
                  ) : (
                    <>
                      <span className="text-zinc-500 line-through text-sm font-bold">₹999/mo</span>
                      <span className="bg-brand-rose/15 text-brand-rose border border-brand-rose/25 font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">SAVE 30%</span>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-semibold tracking-wide leading-relaxed">
                  Subscription plan. Rate locked-in for life. Your price will never increase.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-extrabold text-brand-mint mb-8">
                <Check className="w-4 h-4" /> Start your 7-day free trial · Cancel anytime
              </div>
            </div>

            <div>
              <button 
                onClick={handleStartTrial}
                className="w-full py-4.5 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_35px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.55)] hover:-translate-y-0.5 cursor-pointer"
              >
                Start Trial
              </button>
              <p className="text-[10px] text-zinc-500 text-center mt-3 font-semibold tracking-wide">
                {billingInterval === "yearly" 
                  ? "Billed annually at ₹8,388/year (₹699/mo) · Cancel at any time · Secure checkout powered by Razorpay"
                  : "Thereafter ₹999/month · Cancel at any time · Secure checkout powered by Razorpay"}
              </p>
            </div>
          </div>

          {/* Right Features List Panel */}
          <div className="md:col-span-6 border-t md:border-t-0 md:border-l border-zinc-900 pt-8 md:pt-0 md:pl-8 flex flex-col justify-center">
            <ul className="space-y-3.5 text-xs text-zinc-300">
              {[
                "Real-time Trend Radar & breakout alerts",
                "Competitor analysis & format benchmarks",
                "Subscriber velocity and milestone tracking",
                "Advanced search sorted by custom Virality Score",
                "Daily stats snapshot history & archived reports",
                "Unlimited research notebook slots & outlining workspace",
                "Smart notifications & digests sent to your inbox",
                "Semantic content clustering & relationship mapping",
                "Includes all upcoming features with no pricing increases"
              ].map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-brand-volt font-bold shrink-0 mt-0.5">→</span>
                  <span className="font-normal">{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        </RevealOnScroll>
      </section>

      {/* ── FAQ ACCORDION SECTION (NEW STUNNING WIDGET) ── */}
      <section className="relative z-10 py-16 px-4 md:px-8 max-w-4xl mx-auto">
        <RevealOnScroll>
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-mint/10 border border-brand-mint/20 px-3.5 py-1.5 rounded-full mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-brand-mint" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-mint">Common Questions</span>
          </div>
          <h2 className="font-display font-extrabold text-3.5xl md:text-4.5xl tracking-tight text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
            Clear answers to how Svay helps you grow your channel.
          </p>
        </div>
        </RevealOnScroll>

        {/* FAQs */}
        <RevealOnScroll delay={0.1}>
        <div className="space-y-3">
          {[
            {
              q: "How does Svay help me grow my channel?",
              a: "Svay continuously tracks high-performing channels in your space. By indexing topic relationships and calculating how well videos perform relative to a channel's size, Svay flags high-potential video concepts so you publish content people are already looking for."
            },
            {
              q: "Do I need to connect my YouTube channel?",
              a: "No, connecting your channel is completely optional. You can use Svay strictly for competitor tracking and trend discovery. If you choose to link your channel, we use secure, read-only API access to generate custom growth benchmarks."
            },
            {
              q: "What is the Trend Radar?",
              a: "The Trend Radar constantly monitors tags and topics across your content vertical. When it spots an unusual spike in search volume or view velocity, it alerts you with the exact hooks and formats that triggered the spike."
            },
            {
              q: "How does the free trial and cancellation work?",
              a: "Your trial runs for 7 days with full features unlocked. No credit card is required upfront. If you choose to continue after your trial, billing starts at ₹999/month (or ₹699/month if choosing the yearly plan). You can cancel with a single click in your settings at any time."
            }
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden transition-all duration-300 hover:border-zinc-800"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left transition-colors hover:text-white"
                >
                  <span className="font-display font-bold text-sm md:text-base text-zinc-100">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-brand-volt' : ''}`} />
                </button>
                
                <div 
                  className="transition-all duration-300 ease-in-out overflow-hidden"
                  style={{ maxHeight: isOpen ? '200px' : '0' }}
                >
                  <p className="px-5 pb-5 pt-1 text-xs md:text-sm text-zinc-400 leading-relaxed border-t border-zinc-950/50">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        </RevealOnScroll>
      </section>

      {/* ── BOTTOM CALL TO ACTION ── */}
      <section className="relative z-10 py-16 px-4 md:px-8 max-w-7xl mx-auto">
        <RevealOnScroll>
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md p-10 md:p-16 text-center relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
          {/* Decorative glows */}
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-volt/5 rounded-full filter blur-[80px] pointer-events-none" />
          
          {/* Huge watermark text */}
          <div className="absolute font-logo font-black text-white/[0.015] text-8xl md:text-[160px] leading-none tracking-tighter select-none pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 uppercase">
            SVAY
          </div>

          <div className="relative z-10 max-w-xl mx-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-volt mb-4 block">Publish with confidence</span>
            <h2 className="font-display font-extrabold text-3.5xl md:text-5xl tracking-tight text-white mb-6">
              Build a content library<br/>that stands out.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-10 font-normal">
              Stop leaving your content strategy to chance. Get real-time competitor insights and trend alerts today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="#pricing"
                className="w-full sm:w-auto px-8 py-4 bg-brand-volt hover:bg-[#33f3ff] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(0,240,255,0.15)] text-center"
              >
                Start Trial
              </a>
              <a 
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all text-center"
              >
                Features
              </a>
            </div>
          </div>
        </div>
        </RevealOnScroll>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-zinc-900/80 bg-zinc-950/40 backdrop-blur-md py-16 px-4 md:px-8 mt-20">
        <div className="max-w-5xl mx-auto">
          {/* Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
            {/* Brand Column */}
            <div className="md:col-span-7 flex flex-col items-start gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-brand-volt via-[#00b0ff] to-brand-mint shadow-[0_0_12px_rgba(0,240,255,0.2)]" />
                <span className="font-logo font-black text-base text-white tracking-tight">SVAY</span>
              </div>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
                Decoding YouTube performance data in real-time so you can focus on building a sustainable channel.
              </p>
              {/* Status Indicator */}
              <div className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1 rounded-full text-[9px] font-mono font-bold text-brand-mint mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse" />
                ALL SYSTEMS OPERATIONAL
              </div>
            </div>

            {/* Links Column */}
            <div className="md:col-span-5 flex flex-col md:items-end justify-start gap-4">
              <div className="flex flex-wrap md:justify-end gap-x-8 gap-y-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                <a href="#features" className="hover:text-brand-volt transition-colors">Features</a>
                <a href="#demo" className="hover:text-brand-volt transition-colors">Live Demo</a>
                <a href="#pricing" className="hover:text-brand-volt transition-colors">Pricing</a>
                <Link href="/docs" className="hover:text-brand-volt transition-colors">Docs</Link>
              </div>
              <div className="flex flex-wrap md:justify-end gap-x-6 gap-y-2 text-[9px] font-bold uppercase tracking-widest text-zinc-650 mt-1">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
                <Link href="/refund" className="hover:text-white transition-colors">Refund</Link>
              </div>
            </div>
          </div>

          {/* Bottom Divider & Copyright */}
          <div className="border-t border-zinc-900/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-mono text-zinc-600 font-bold uppercase tracking-widest">
              © 2026 Svay Intelligence Platform. All rights reserved.
            </p>
            <a 
              href="#" 
              className="text-[9px] font-mono text-zinc-500 hover:text-white uppercase tracking-widest font-bold flex items-center gap-1 transition-colors"
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
