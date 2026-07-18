'use client';

import Link from 'next/link';

/**
 * Site footer.
 */
export default function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-zinc-900/80 bg-zinc-950/40 backdrop-blur-md py-16 px-4 md:px-8 mt-20">
      <div className="max-w-5xl mx-auto">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
          {/* Brand column */}
          <div className="md:col-span-7 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-brand-volt via-[#00b0ff] to-brand-mint shadow-[0_0_12px_rgba(0,240,255,0.2)]" />
              <span className="font-logo font-black text-base text-white tracking-tight">SVAY</span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-sm">
              Decoding YouTube performance data in real-time so you can focus on building a
              sustainable channel.
            </p>
            <div className="inline-flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/80 px-3 py-1 rounded-full text-[9px] font-mono font-bold text-brand-mint mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse" />
              ALL SYSTEMS OPERATIONAL
            </div>
          </div>

          {/* Links column */}
          <div className="md:col-span-5 flex flex-col md:items-end justify-start gap-4">
            <div className="flex flex-wrap md:justify-end gap-x-8 gap-y-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <a href="#features" className="hover:text-brand-volt transition-colors">Features</a>
              <a href="#demo" className="hover:text-brand-volt transition-colors">Live Demo</a>
              <a href="#pricing" className="hover:text-brand-volt transition-colors">Pricing</a>
              <Link href="/tools" className="hover:text-brand-volt transition-colors">Free Tools</Link>
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

        {/* Bottom bar */}
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
  );
}
