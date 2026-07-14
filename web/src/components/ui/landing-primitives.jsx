"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function LandingSection({
  id,
  children,
  className,
  containerClassName,
  showGrid = true,
  showGlow = false,
  tone = "default",
}) {
  return (
    <section
      id={id}
      className={cn(
        "landing-section features-section",
        tone === "soft" && "landing-section--soft",
        className
      )}
    >
      {showGrid && (
        <div
          aria-hidden
          className="features-grid-bg pointer-events-none absolute inset-0"
        />
      )}
      {showGlow && (
        <div
          aria-hidden
          className="landing-glow pointer-events-none absolute left-1/2 top-0 h-[420px] w-[min(100%,800px)] -translate-x-1/2 rounded-full blur-3xl"
        />
      )}
      <div className={cn("landing-container", containerClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Passthrough — scroll animations removed */
export function LandingReveal({ children, className }) {
  return <div className={className}>{children}</div>;
}

/** Passthrough — scroll animations removed */
export function LandingHeaderReveal({ children, className }) {
  return <div className={className}>{children}</div>;
}

export function LandingShell({
  children,
  className,
  featured = false,
  centerWatermark,
  interactive = true,
}) {
  const ref = useRef(null);
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });

  const handleMove = (e) => {
    if (!interactive) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
      className={cn(
        "landing-shell group",
        featured && "landing-shell-featured",
        className
      )}
    >
      {interactive ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-500"
          style={{
            opacity: spot.active ? 1 : 0,
            background: `radial-gradient(560px circle at ${spot.x}% ${spot.y}%, rgba(96,165,250,0.09), transparent 42%)`,
          }}
        />
      ) : null}
      {centerWatermark ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-12 z-[2] font-display text-[9rem] leading-none tracking-tighter text-white/[0.025] select-none sm:text-[12rem]"
        >
          {centerWatermark}
        </div>
      ) : null}
      <div className="relative z-[3]">{children}</div>
    </div>
  );
}

export function LandingBadge({ icon: Icon, label, className }) {
  return (
    <div className={cn("landing-badge", className)}>
      {Icon ? (
        <Icon className="size-3 text-landing-accent/80" />
      ) : (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-landing-accent/60 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-landing-accent" />
        </span>
      )}
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-white/50">
        {label}
      </span>
    </div>
  );
}

export function LandingHeading({
  title,
  highlight,
  description,
  align = "left",
  size = "section",
  className,
  descriptionClassName,
}) {
  const sizeClass =
    size === "hero"
      ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
      : "text-3xl sm:text-4xl md:text-5xl";

  return (
    <div
      className={cn(
        align === "center" && "text-center",
        align === "center" && "mx-auto",
        className
      )}
    >
      <h2
        className={cn(
          "font-display leading-[1.06] tracking-tight text-white",
          sizeClass,
          align === "center" && "max-w-3xl"
        )}
      >
        {title}
        {highlight ? (
          <span className="landing-gradient-text mt-1.5 block sm:mt-1">
            {highlight}
          </span>
        ) : null}
      </h2>
      {description ? (
        <p
          className={cn(
            "landing-lead mt-5",
            align === "center" ? "mx-auto max-w-lg" : "max-w-xl",
            descriptionClassName
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function LandingButton({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        variant === "primary" ? "landing-btn-primary" : "landing-btn-secondary",
        className
      )}
    >
      {children}
    </button>
  );
}
