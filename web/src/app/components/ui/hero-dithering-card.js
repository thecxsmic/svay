"use client";

import { ArrowRight, Play } from "lucide-react";
import { useState, Suspense, lazy, useRef, useEffect } from "react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

function DitheringFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 70% 55% at 50% 30%, rgba(96,165,250,0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 70%, rgba(59,130,246,0.1), transparent 55%), #05050c",
      }}
    />
  );
}

function DitheringWrapper({ isHovered }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(ref.current);
    setSize({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    return () => ro.disconnect();
  }, []);

  if (failed) {
    return <DitheringFallback />;
  }

  return (
    <div ref={ref} className="absolute inset-0">
      <DitheringFallback />
      {size.w > 0 && size.h > 0 && (
        <Suspense fallback={null}>
          <ErrorBoundary onError={() => setFailed(true)}>
            <Dithering
              colorBack="#05050c"
              colorFront="#60a5fa"
              shape="warp"
              type="4x4"
              speed={isHovered ? 0.7 : 0.18}
              style={{ width: size.w, height: size.h, display: "block" }}
              minPixelRatio={1}
            />
          </ErrorBoundary>
        </Suspense>
      )}
    </div>
  );
}

/** Minimal error boundary so a shader chunk failure never blanks the hero */
import { Component } from "react";
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false);

  const enterDemo = () => {
    document.cookie = "demo_mode=true; path=/; max-age=31536000;";
    window.location.reload();
  };

  return (
    <section className="relative w-full px-4 pb-2 pt-5 sm:px-6 sm:pt-7 md:pt-9">
      <div
        className="relative mx-auto max-w-7xl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="landing-nav-border relative flex min-h-[min(78vh,720px)] flex-col items-center justify-center overflow-hidden rounded-[1.75rem]"
          style={{ background: "#05050c" }}
        >
          <DitheringWrapper isHovered={isHovered} />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(96,165,250,0.14), transparent 55%), linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(3,3,8,0.68) 65%, rgba(3,3,8,0.94))",
            }}
          />

          <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-16 text-center sm:px-10 sm:py-20 md:py-24">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400/50 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-400" />
              </span>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/50">
                Creator intelligence
              </span>
            </div>

            <h1 className="max-w-4xl font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              YouTube trend radar.
              <span
                className="mt-1.5 block bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent sm:mt-1"
              >
                Dominate your niche.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
              Svay is creator intelligence for YouTube — viral trend radar,
              competitor tracking, and growth analytics so you act on breakout
              topics before the niche moves on.
            </p>

            <div className="mt-10 flex w-full max-w-lg flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/sign-in";
                }}
                className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-white/85 bg-gradient-to-b from-white to-[#e8f2ff] px-8 text-sm font-bold text-[#030308] shadow-[0_12px_40px_-16px_rgba(96,165,250,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_56px_-8px_rgba(96,165,250,0.55)] active:scale-[0.98] sm:w-auto"
              >
                Start free trial
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={enterDemo}
                className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] px-8 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:border-blue-400/35 hover:bg-blue-400/10 active:scale-[0.98] sm:w-auto"
              >
                <Play className="size-3.5 fill-white/80 text-white/80" />
                Launch demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
