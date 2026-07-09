'use client';

import { Users, Star } from 'lucide-react';
import RevealOnScroll from '../ui/RevealOnScroll';
import SectionBadge from '../ui/SectionBadge';
import { TESTIMONIALS } from '../data/landingTestimonials';

/**
 * Renders the correct inline SVG avatar for each testimonial variant.
 *
 * @param {{ variant: string; gradFrom: string; gradTo: string; id: string }} props
 */
function TestimonialAvatar({ variant, gradFrom, gradTo, id }) {
  const gradId = `testGrad_${id}`;
  return (
    <div className="w-10 h-10 rounded-full border border-zinc-800 overflow-hidden bg-zinc-900 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradFrom} />
            <stop offset="100%" stopColor={gradTo} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill={`url(#${gradId})`} />
        {variant === 'tech' && (
          <>
            <circle cx="50" cy="45" r="18" fill="white" fillOpacity="0.9" />
            <path d="M25 80c0-15 10-22 25-22s25 7 25 22" fill="white" fillOpacity="0.9" />
            <rect x="22" y="38" width="8" height="16" rx="4" fill="#00f0ff" />
            <rect x="70" y="38" width="8" height="16" rx="4" fill="#00f0ff" />
            <path d="M26 38c0-12 10-18 24-18s24 6 24 18" stroke="#00f0ff" strokeWidth="4" fill="none" />
          </>
        )}
        {variant === 'glasses' && (
          <>
            <circle cx="50" cy="45" r="16" fill="black" fillOpacity="0.4" />
            <path d="M28 78c0-12 10-18 22-18s22 6 22 18" fill="black" fillOpacity="0.4" />
            <rect x="34" y="40" width="13" height="9" rx="2" stroke="#ff4f6d" strokeWidth="2.5" fill="none" />
            <rect x="53" y="40" width="13" height="9" rx="2" stroke="#ff4f6d" strokeWidth="2.5" fill="none" />
            <line x1="47" y1="44" x2="53" y2="44" stroke="#ff4f6d" strokeWidth="2.5" />
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * Renders a single testimonial card.
 *
 * @param {{ testimonial: import('../data/landingTestimonials').Testimonial; delay: number }} props
 */
function TestimonialCard({ testimonial, delay }) {
  return (
    <RevealOnScroll delay={delay}>
      <div
        className={`p-6 rounded-3xl bg-zinc-950/60 border border-white/[0.08] backdrop-blur-md relative overflow-hidden flex flex-col justify-between group hover:border-${testimonial.accentColor}/20 transition-all duration-300 shadow-[0_15px_30px_rgba(0,0,0,0.8)]`}
      >
        <div className={`absolute top-0 right-0 p-4 text-${testimonial.accentColor} opacity-5 group-hover:opacity-10 transition-opacity`}>
          <Star className={`w-12 h-12 fill-${testimonial.accentColor}`} />
        </div>
        <p className="text-zinc-350 text-xs md:text-sm leading-relaxed font-normal italic mb-6 text-left">
          {testimonial.quote}
        </p>
        <div className="flex items-center gap-3">
          <TestimonialAvatar
            variant={testimonial.avatarVariant}
            gradFrom={testimonial.avatarGradFrom}
            gradTo={testimonial.avatarGradTo}
            id={testimonial.id}
          />
          <div className="text-left">
            <p className="text-xs font-black text-white">{testimonial.name}</p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{testimonial.role}</p>
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
}

/**
 * Testimonials social proof section.
 */
export default function LandingTestimonials() {
  return (
    <section className="relative z-10 py-16 px-4 md:px-8 max-w-5xl mx-auto">
      <RevealOnScroll>
        <div className="text-center mb-12">
          <SectionBadge
            icon={<Users className="w-3.5 h-3.5" />}
            label="Creator Feedback"
            colorClass="text-brand-rose"
            bgClass="bg-brand-rose/10"
            borderClass="border-brand-rose/20"
          />
          <h2 className="font-display font-extrabold text-3.5xl md:text-4.5xl tracking-tight text-white mb-4">
            What creators are saying
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto font-normal">
            Hear from channels utilizing Svay to optimize their workflow.
          </p>
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <TestimonialCard key={t.id} testimonial={t} delay={(i + 1) * 0.1} />
        ))}
      </div>
    </section>
  );
}
