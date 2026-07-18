'use client';

import { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

/**
 * @param {{
 *   scrolled: boolean;
 *   onEnterDemo: (e?: React.MouseEvent) => void;
 * }} props
 */
export default function LandingNav({ scrolled, onEnterDemo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 w-full max-w-[100vw] z-50 px-3 sm:px-4 md:px-8 py-4 transition-all duration-300">
      <div
        className={`max-w-5xl w-full mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-0 lg:gap-4 rounded-2xl bg-black/85 border ${
          scrolled
            ? 'border-brand-volt/20 shadow-[0_8px_32px_rgba(0,240,255,0.05)]'
            : 'border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.8)]'
        } backdrop-blur-md transition-[border-color,background-color,box-shadow] duration-200`}
      >
        {/* Logo + hamburger row */}
        <div className="flex items-center justify-between w-full lg:w-auto py-1">
          <a
            href="#"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-volt via-[#00b0ff] to-brand-mint shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] transition-all" />
            <span className="font-logo font-black text-lg text-white tracking-tight">SVAY</span>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center p-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-white bg-zinc-950/40 hover:bg-zinc-900 transition-all cursor-pointer focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav links */}
        <nav
          className={`${
            mobileMenuOpen ? 'flex' : 'hidden lg:flex'
          } flex-col lg:flex-row items-start lg:items-center gap-1.5 lg:gap-8 text-[11px] font-bold uppercase tracking-wider text-zinc-400 w-full lg:w-auto pt-4 pb-2 lg:py-0 border-t border-zinc-900/80 lg:border-t-0 mt-3 lg:mt-0`}
        >
          {[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Free Tools', href: '/tools' },
            { label: 'Docs', href: '/docs' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white transition-colors py-2 px-3 lg:py-1 lg:px-0 w-full lg:w-auto rounded-xl hover:bg-white/5 lg:hover:bg-transparent relative group flex items-center"
            >
              {label}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-volt transition-all group-hover:w-full hidden lg:block" />
            </a>
          ))}
          <button
            onClick={(e) => {
              setMobileMenuOpen(false);
              onEnterDemo(e);
            }}
            className="hover:text-white text-left transition-colors py-2 px-3 lg:py-1 lg:px-0 w-full lg:w-auto rounded-xl hover:bg-white/5 lg:hover:bg-transparent relative group flex items-center font-bold uppercase tracking-wider text-zinc-400 text-[11px] cursor-pointer"
          >
            Launch Demo
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-volt transition-all group-hover:w-full hidden lg:block" />
          </button>
        </nav>

        {/* CTA buttons */}
        <div
          className={`${
            mobileMenuOpen ? 'flex' : 'hidden lg:flex'
          } flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto pt-3 pb-1 lg:py-0 border-t border-zinc-900/80 lg:border-t-0 mt-2 lg:mt-0`}
        >
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              window.location.href = '/sign-in';
            }}
            className="px-5 py-3 lg:py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-extrabold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer text-center"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              window.location.href = '/sign-in';
            }}
            className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-[11px] font-bold uppercase tracking-wider text-black rounded-xl group bg-gradient-to-br from-brand-volt to-brand-mint group-hover:from-brand-volt group-hover:to-brand-mint hover:text-black focus:ring-4 focus:outline-none focus:ring-lime-800 transition-all duration-300 w-full lg:w-auto cursor-pointer"
          >
            <span className="relative px-5 py-2.5 lg:py-2 transition-all ease-in duration-75 bg-brand-volt rounded-xl group-hover:bg-opacity-0 group-hover:text-white text-black font-extrabold flex items-center justify-center gap-1.5 w-full lg:w-auto">
              Start Trial <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
