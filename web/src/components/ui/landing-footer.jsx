"use client";

import Link from "next/link";
import { ArrowUp, ArrowUpRight, ExternalLink } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Live demo", href: "#", demo: true },
];

const RESOURCE_LINKS = [
  { label: "Documentation", href: "/docs" },
  { label: "Support", href: "/support" },
  { label: "Sign in", href: "/sign-in" },
  { label: "Start trial", href: "/sign-in" },
];

const LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Refund", href: "/refund" },
];

function FooterLink({ href, children, onClick, external }) {
  const className =
    "group inline-flex items-center gap-1.5 text-[13px] text-white/45 transition-colors duration-200 hover:text-white";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} cursor-pointer`}>
        {children}
        <ArrowUpRight className="size-3 opacity-0 -translate-y-0.5 transition-all duration-200 group-hover:opacity-50 group-hover:translate-y-0" />
      </button>
    );
  }

  if (href?.startsWith("#") || href?.startsWith("http")) {
    return (
      <a href={href} className={className}>
        {children}
        {external ? (
          <ExternalLink className="size-3 opacity-0 transition-opacity duration-200 group-hover:opacity-50" />
        ) : (
          <ArrowUpRight className="size-3 opacity-0 -translate-y-0.5 transition-all duration-200 group-hover:opacity-50 group-hover:translate-y-0" />
        )}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
      <ArrowUpRight className="size-3 opacity-0 -translate-y-0.5 transition-all duration-200 group-hover:opacity-50 group-hover:translate-y-0" />
    </Link>
  );
}

function LinkColumn({ title, children }) {
  return (
    <div>
      <p className="mb-4 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-white/30">
        {title}
      </p>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

export function LandingFooter({ onLaunchDemo }) {
  const scrollTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-[2] w-full overflow-hidden px-4 pb-6 pt-0 sm:px-6 sm:pb-8">
      <div className="relative mx-auto max-w-7xl">
        <div className="landing-nav-border landing-footer-panel relative overflow-hidden rounded-[1.75rem]">
          {/* ambient light */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-white/[0.03] blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-white/[0.025] blur-3xl"
          />

          {/* giant watermark */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 flex select-none items-end justify-center overflow-hidden"
          >
            <span className="translate-y-[28%] bg-gradient-to-b from-white/[0.06] to-transparent bg-clip-text font-display text-[clamp(5.5rem,18vw,11rem)] font-semibold leading-none tracking-tighter text-transparent">
              SVAY
            </span>
          </div>

          <div className="relative z-[1] px-6 py-8 sm:px-8 sm:py-10 md:px-10 md:py-11">
            {/* top grid */}
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
              {/* brand */}
              <div className="flex flex-col gap-5 lg:col-span-5">
                <a href="#" onClick={scrollTop} className="group inline-flex w-fit items-center gap-2.5">
                  <div className="size-6 rounded-full bg-gradient-to-tr from-white/80 via-white/50 to-white/20 shadow-[0_0_18px_rgba(255,255,255,0.12)] transition-shadow duration-300 group-hover:shadow-[0_0_24px_rgba(255,255,255,0.2)]" />
                  <span className="font-logo text-lg tracking-tight text-white">
                    SVAY
                  </span>
                </a>

                <p className="max-w-sm text-sm leading-relaxed text-white/45">
                  Real-time creator intelligence — Trend Radar, competitor
                  benchmarks, and Virality Score so you publish with confidence.
                </p>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/50 opacity-50" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white/80" />
                    </span>
                    <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-white/50">
                      All systems operational
                    </span>
                  </div>
                  <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">
                      Built for creators
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap gap-2.5">
                  <Link
                    href="/sign-in"
                    className="inline-flex h-10 items-center justify-center rounded-full border border-white/70 bg-white px-5 text-xs font-bold text-[#030308] transition-all duration-300 hover:bg-white/90 active:scale-[0.98]"
                  >
                    Start free trial
                  </Link>
                  <button
                    type="button"
                    onClick={onLaunchDemo}
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03] px-5 text-xs font-bold text-white/80 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
                  >
                    Launch demo
                  </button>
                </div>
              </div>

              {/* link columns */}
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:gap-6">
                <LinkColumn title="Product">
                  {PRODUCT_LINKS.map((item) => (
                    <li key={item.label}>
                      {item.demo ? (
                        <FooterLink onClick={onLaunchDemo}>{item.label}</FooterLink>
                      ) : (
                        <FooterLink href={item.href}>{item.label}</FooterLink>
                      )}
                    </li>
                  ))}
                </LinkColumn>

                <LinkColumn title="Resources">
                  {RESOURCE_LINKS.map((item) => (
                    <li key={item.label}>
                      <FooterLink href={item.href}>{item.label}</FooterLink>
                    </li>
                  ))}
                </LinkColumn>

                <LinkColumn title="Legal">
                  {LEGAL_LINKS.map((item) => (
                    <li key={item.label}>
                      <FooterLink href={item.href}>{item.label}</FooterLink>
                    </li>
                  ))}
                </LinkColumn>
              </div>
            </div>

            {/* bottom bar */}
            <div className="mt-9 flex flex-col gap-4 border-t border-white/[0.08] pt-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/28">
                  © 2026 Svay Intelligence Platform
                </p>
                <span
                  aria-hidden
                  className="hidden h-3 w-px bg-white/10 sm:block"
                />
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/20">
                  All rights reserved
                </p>
              </div>

              <button
                type="button"
                onClick={scrollTop}
                className="group inline-flex h-9 w-fit cursor-pointer items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white/70"
              >
                Back to top
                <span className="flex size-5 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] transition-transform duration-300 group-hover:-translate-y-0.5">
                  <ArrowUp className="size-3" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
