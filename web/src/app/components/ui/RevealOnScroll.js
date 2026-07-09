'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * Wraps children in a scroll-triggered fade+slide-up animation.
 *
 * @param {{ children: React.ReactNode; delay?: number }} props
 */
export default function RevealOnScroll({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
