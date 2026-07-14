import { useLayoutEffect, useRef, useState, useId, useEffect } from 'react';
import { gsap } from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import './CardNav.css';

/* ─────────────── Inline Glass Filter ─────────────── */
function GlassFilter({ filterId, redGradId, blueGradId, feImageRef, redChannelRef, greenChannelRef, blueChannelRef, gaussianBlurRef }) {
  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
          <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
          <feColorMatrix in="dispRed" type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
          <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
          <feColorMatrix in="dispGreen" type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
          <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
          <feColorMatrix in="dispBlue" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
        </filter>
      </defs>
    </svg>
  );
}

/* ─────────────── CardNav ─────────────── */
const CardNav = ({
  logo,
  logoAlt = 'Logo',
  items,
  className = '',
  ease = 'power3.out',
  baseColor,
  menuColor,
  buttonBgColor,
  buttonTextColor,
  theme = 'dark'
}) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef(null);
  const cardsRef = useRef([]);
  const tlRef = useRef(null);

  /* — Glass filter refs — */
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `card-nav-glass-${uniqueId}`;
  const redGradId = `rg-${uniqueId}`;
  const blueGradId = `bg-${uniqueId}`;
  const feImageRef = useRef(null);
  const redChannelRef = useRef(null);
  const greenChannelRef = useRef(null);
  const blueChannelRef = useRef(null);
  const gaussianBlurRef = useRef(null);

  const isDark = theme === 'dark';
  const resolvedMenuColor = menuColor || (isDark ? '#ffffff' : '#000000');
  const resolvedButtonBg = buttonBgColor || (isDark ? '#00f0ff' : '#111111');
  const resolvedButtonText = buttonTextColor || (isDark ? '#000000' : '#ffffff');

  /* ── Glass displacement map generation ── */
  const generateDisplacementMap = () => {
    const rect = navRef.current?.getBoundingClientRect();
    const w = rect?.width || 800;
    const h = rect?.height || 60;
    const borderRadius = 12;
    const edgeSize = Math.min(w, h) * 0.035;

    const svgContent = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/>
        </linearGradient>
        <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
      <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${redGradId})"/>
      <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:screen"/>
      <rect x="${edgeSize}" y="${edgeSize}" width="${w - edgeSize * 2}" height="${h - edgeSize * 2}" rx="${borderRadius}"
        fill="hsl(0 0% 50% / 0.93)" style="filter:blur(11px)"/>
    </svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  const applyGlassFilter = () => {
    if (!feImageRef.current) return;
    feImageRef.current.setAttribute('href', generateDisplacementMap());
    [{ ref: redChannelRef, offset: 0 }, { ref: greenChannelRef, offset: 10 }, { ref: blueChannelRef, offset: 20 }]
      .forEach(({ ref, offset }) => {
        if (ref.current) {
          ref.current.setAttribute('scale', String(-180 + offset));
          ref.current.setAttribute('xChannelSelector', 'R');
          ref.current.setAttribute('yChannelSelector', 'G');
        }
      });
    gaussianBlurRef.current?.setAttribute('stdDeviation', '0.5');
  };

  /* ── Detect if browser supports SVG backdrop-filter (Chromium) ── */
  const [svgSupported, setSvgSupported] = useState(false);
  useEffect(() => {
    const isChromium = !!window.chrome || /Chrome|Edg|OPR/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    setSvgSupported(isChromium && !isSafari && !isFirefox);
  }, []);

  /* Apply filter whenever SVG is supported and on resize */
  useEffect(() => {
    if (!svgSupported) return;
    setTimeout(applyGlassFilter, 50);
    const ro = new ResizeObserver(() => setTimeout(applyGlassFilter, 0));
    if (navRef.current) ro.observe(navRef.current);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgSupported]);

  /* ── GSAP timeline ── */
  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content');
      if (contentEl) {
        const prev = { vis: contentEl.style.visibility, pe: contentEl.style.pointerEvents, pos: contentEl.style.position, h: contentEl.style.height };
        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';
        contentEl.offsetHeight;
        const result = 60 + contentEl.scrollHeight + 16;
        Object.assign(contentEl.style, { visibility: prev.vis, pointerEvents: prev.pe, position: prev.pos, height: prev.h });
        return result;
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });
    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, { height: calculateHeight, duration: 0.45, ease });
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.15');
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => { tl?.kill(); tlRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        gsap.set(navRef.current, { height: calculateHeight() });
        tlRef.current.kill();
        const tl = createTimeline();
        if (tl) { tl.progress(1); tlRef.current = tl; }
      } else {
        tlRef.current.kill();
        const tl = createTimeline();
        if (tl) tlRef.current = tl;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = i => el => { if (el) cardsRef.current[i] = el; };

  /* ── Glass styles applied directly on nav ── */
  const glassStyle = svgSupported
    ? {
        background: `hsl(0 0% 0% / 0.08)`,
        backdropFilter: `url(#${filterId}) saturate(1.8)`,
        boxShadow: `0 0 2px 1px rgba(255,255,255,0.18) inset,
                    0 0 10px 4px rgba(255,255,255,0.07) inset,
                    0 8px 32px rgba(0,0,0,0.4),
                    0 2px 8px rgba(0,0,0,0.3)`,
        border: '0.5px solid rgba(255,255,255,0.18)',
      }
    : {
        background: 'rgba(10,10,15,0.55)',
        backdropFilter: 'blur(20px) saturate(1.8) brightness(1.15)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8) brightness(1.15)',
        boxShadow: `0 0 2px 1px rgba(255,255,255,0.15) inset,
                    0 0 12px 4px rgba(255,255,255,0.06) inset,
                    0 8px 32px rgba(0,0,0,0.5),
                    0 2px 8px rgba(0,0,0,0.35)`,
        border: '0.5px solid rgba(255,255,255,0.2)',
      };

  return (
    <div className={`card-nav-container ${className}`}>
      {/* Hidden SVG filter definition */}
      <GlassFilter
        filterId={filterId}
        redGradId={redGradId}
        blueGradId={blueGradId}
        feImageRef={feImageRef}
        redChannelRef={redChannelRef}
        greenChannelRef={greenChannelRef}
        blueChannelRef={blueChannelRef}
        gaussianBlurRef={gaussianBlurRef}
      />

      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''}`}
        style={glassStyle}
      >
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); } }}
            role="button"
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            tabIndex={0}
            style={{ color: resolvedMenuColor }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <div className="logo-container">
            {logo ? (
              typeof logo === 'string' ? <img src={logo} alt={logoAlt} className="logo" /> : logo
            ) : (
              <a href="#" className="flex items-center gap-2.5 group">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00f0ff] via-[#00b0ff] to-[#0052ff] shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] transition-all" />
                <span className="font-logo font-black text-lg text-white tracking-tight">SVAY</span>
              </a>
            )}
          </div>

          <button
            type="button"
            className="card-nav-cta-button"
            style={{ backgroundColor: resolvedButtonBg, color: resolvedButtonText }}
            onClick={() => window.location.href = '/sign-in'}
          >
            Get Started
          </button>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    href={lnk.href || '#'}
                    aria-label={lnk.ariaLabel}
                    onClick={lnk.onClick ? (e) => { e.preventDefault(); lnk.onClick(e); } : undefined}
                  >
                    <ArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;
