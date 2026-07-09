'use client';

import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';

/**
 * Animates a number from 0 to `target` when it enters the viewport.
 *
 * @param {{ target: number; suffix?: string; duration?: number }} props
 */
export default function AnimatedCounter({ target, suffix = '', duration = 1500 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
