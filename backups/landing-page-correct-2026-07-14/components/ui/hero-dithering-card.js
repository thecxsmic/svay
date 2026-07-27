"use client";

import { ArrowRight } from "lucide-react";
import { useState, Suspense, lazy, useRef, useEffect } from "react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

function DitheringWrapper({ isHovered }) {
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(ref.current);
    // trigger immediately
    setSize({ w: ref.current.offsetWidth, h: ref.current.offsetHeight });
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      {size.w > 0 && size.h > 0 && (
        <Suspense fallback={null}>
          <Dithering
            colorBack="#060b18"
            colorFront="#3b82f6"
            shape="warp"
            type="4x4"
            speed={isHovered ? 0.8 : 0.25}
            style={{ width: size.w, height: size.h, display: "block" }}
            minPixelRatio={1}
          />
        </Suspense>
      )}
    </div>
  );
}

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="w-full flex justify-center items-center px-4 md:px-6">
      <div
        className="w-full max-w-7xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className="relative overflow-hidden rounded-xl border border-white/10 shadow-xl flex flex-col items-center justify-center"
          style={{ background: "#060b18" }}
        >
          {/* Dithering dots background */}
          <DitheringWrapper isHovered={isHovered} />

          {/* Dark overlay for text contrast */}
          <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-10 w-full">
            <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight text-white mb-8 leading-[1.05]">
              Track trends, <br />
              <span className="text-white/90">dominate your niche.</span>
            </h2>

            <p className="text-white/80 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
              Join visionary creators using SVAY to uncover high-performing content.
              Actionable insights, delivered instantly.
            </p>

            <div className="flex flex-col gap-3 items-center w-full sm:w-auto">
              <button
                onClick={() => window.location.href = '/sign-in'}
                className="group inline-flex h-14 w-full sm:w-64 items-center justify-center gap-3 rounded-full bg-white px-8 text-base font-bold text-black transition-all duration-300 hover:bg-white/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] active:scale-95"
              >
                <span>Sign In</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => {
                  document.cookie = 'demo_mode=true; path=/; max-age=31536000;';
                  window.location.reload();
                }}
                className="group inline-flex h-14 w-full sm:w-64 items-center justify-center gap-3 rounded-full bg-transparent px-8 text-base font-bold text-white transition-all duration-300 hover:bg-white/5 active:scale-95"
              >
                <span>Launch Demo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
