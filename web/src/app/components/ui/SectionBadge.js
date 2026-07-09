'use client';

/**
 * Pill badge shown above section headings.
 *
 * @param {{
 *   icon: React.ReactNode;
 *   label: string;
 *   colorClass?: string;          // e.g. "text-brand-volt"
 *   bgClass?: string;             // e.g. "bg-brand-volt/10"
 *   borderClass?: string;         // e.g. "border-brand-volt/20"
 * }} props
 */
export default function SectionBadge({
  icon,
  label,
  colorClass = 'text-brand-volt',
  bgClass = 'bg-brand-volt/10',
  borderClass = 'border-brand-volt/20',
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 ${bgClass} border ${borderClass} px-3.5 py-1.5 rounded-full mb-4`}
    >
      <span className={colorClass}>{icon}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
        {label}
      </span>
    </div>
  );
}
