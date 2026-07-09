'use client';

/**
 * Small pill tag used at the bottom of feature cards.
 *
 * @param {{ label: string }} props
 */
export default function FeatureTag({ label }) {
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 border border-white/[0.04] px-2.5 py-1 rounded bg-black/40">
      {label}
    </span>
  );
}
