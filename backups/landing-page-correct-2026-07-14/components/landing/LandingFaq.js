'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import RevealOnScroll from '../ui/RevealOnScroll';
import SectionBadge from '../ui/SectionBadge';
import { FAQ_ITEMS } from '../data/landingFaq';

/**
 * Expandable FAQ accordion item.
 *
 * @param {{ faq: import('../data/landingFaq').FaqItem; index: number; isOpen: boolean; onToggle: () => void }} props
 */
function FaqItem({ faq, index, isOpen, onToggle }) {
  return (
    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden transition-all duration-300 hover:border-zinc-800">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between gap-4 text-left transition-colors hover:text-white"
      >
        <span className="font-display font-bold text-sm md:text-base text-zinc-100">{faq.q}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition-transform duration-300 shrink-0 ${
            isOpen ? 'rotate-180 text-brand-volt' : ''
          }`}
        />
      </button>
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ maxHeight: isOpen ? '200px' : '0' }}
      >
        <p className="px-5 pb-5 pt-1 text-xs md:text-sm text-zinc-400 leading-relaxed border-t border-zinc-950/50">
          {faq.a}
        </p>
      </div>
    </div>
  );
}

/**
 * FAQ accordion section.
 */
export default function LandingFaq() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section className="relative z-10 py-16 px-4 md:px-8 max-w-4xl mx-auto">
      <RevealOnScroll>
        <div className="text-center mb-12">
          <SectionBadge
            icon={<HelpCircle className="w-3.5 h-3.5" />}
            label="Common Questions"
            colorClass="text-brand-mint"
            bgClass="bg-brand-mint/10"
            borderClass="border-brand-mint/20"
          />
          <h2 className="font-display font-extrabold text-3.5xl md:text-4.5xl tracking-tight text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
            Clear answers to how Svay helps you grow your channel.
          </p>
        </div>
      </RevealOnScroll>

      <RevealOnScroll delay={0.1}>
        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, idx) => (
            <FaqItem
              key={idx}
              faq={faq}
              index={idx}
              isOpen={openFaq === idx}
              onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
            />
          ))}
        </div>
      </RevealOnScroll>
    </section>
  );
}
