'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useNavProgress } from '@/contexts/navProgress';
import { BrandOrb } from '@/app/components/dashboard/ui';

/**
 * Visible route-transition feedback for the dashboard shell.
 * Top progress line + floating "Loading page" pill (mobile + desktop).
 */
export default function DashboardNavLoader() {
  const ctx = useNavProgress();
  if (!ctx) return null;

  const { pending, progress, targetLabel } = ctx;
  const label = targetLabel ? `Loading ${targetLabel}` : 'Loading page';

  return (
    <AnimatePresence>
      {pending && (
        <>
          {/* Top progress bar */}
          <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[240] h-[2px] overflow-hidden bg-white/[0.04]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label={label}
          >
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-geist-success via-[#00f0ff] to-geist-success shadow-[0_0_12px_rgba(0,240,255,0.55)]"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 24 }}
            />
          </div>

          {/* Floating status pill — clear that another page is loading */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[240] flex justify-center px-4 md:top-4"
          >
            <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-black/80 px-3.5 py-2 shadow-2xl backdrop-blur-md">
              <BrandOrb size="xs" pulse />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-300">
                {label}
              </span>
              <span className="tabular-nums text-[10px] font-bold text-zinc-600">
                {Math.round(progress)}%
              </span>
            </div>
          </motion.div>

          {/* Soft content veil so the switch feels intentional */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[230] bg-black/25 md:bg-black/15"
            aria-hidden
          />
        </>
      )}
    </AnimatePresence>
  );
}
