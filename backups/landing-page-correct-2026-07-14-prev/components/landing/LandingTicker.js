'use client';

import { TICKER_ITEMS } from '../data/landingContent';

/**
 * Scrolling marquee ticker strip between hero and demo sections.
 */
export default function LandingTicker() {
  const items = TICKER_ITEMS;

  const renderItems = () =>
    items.map((item, i) => (
      <span key={i} className="contents">
        <span>
          {item.icon} <strong className={item.highlightColor}>{item.highlight}</strong>
          {item.rest}
        </span>
        <span>✦</span>
      </span>
    ));

  return (
    <section className="border-y border-zinc-900 bg-black/40 backdrop-blur-sm py-4 overflow-hidden relative z-10">
      <div className="marquee-track flex gap-16 whitespace-nowrap flex-row w-max">
        <div className="flex gap-16 text-zinc-500 font-mono text-[11px] font-bold uppercase tracking-wider">
          {renderItems()}
        </div>
        {/* Duplicate for seamless loop */}
        <div className="flex gap-16 text-zinc-500 font-mono text-[11px] font-bold uppercase tracking-wider">
          {renderItems()}
        </div>
      </div>
    </section>
  );
}
