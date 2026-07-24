'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';

const NavProgressContext = createContext(null);

/**
 * Tracks in-app dashboard navigations so we can show a route-loading indicator.
 * - start(): call before router.push / when a link navigation begins
 * - pending: true while waiting for the next pathname change
 */
export function NavProgressProvider({ children }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetLabel, setTargetLabel] = useState('');
  const tickRef = useRef(null);
  const safetyRef = useRef(null);
  const doneRef = useRef(null);
  const pendingPathRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (safetyRef.current) {
      clearTimeout(safetyRef.current);
      safetyRef.current = null;
    }
    if (doneRef.current) {
      clearTimeout(doneRef.current);
      doneRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setProgress(100);
    // brief complete flash then hide
    doneRef.current = window.setTimeout(() => {
      setPending(false);
      setProgress(0);
      setTargetLabel('');
      pendingPathRef.current = null;
      doneRef.current = null;
    }, 220);
  }, [clearTimers]);

  const start = useCallback(
    (opts = {}) => {
      const href = typeof opts === 'string' ? opts : opts?.href;
      const label = typeof opts === 'object' ? opts?.label : undefined;

      // Ignore same-route navigations
      if (href) {
        try {
          const url = new URL(href, window.location.origin);
          if (
            url.origin === window.location.origin &&
            url.pathname === window.location.pathname &&
            url.search === window.location.search
          ) {
            return;
          }
          pendingPathRef.current = url.pathname;
        } catch {
          pendingPathRef.current = null;
        }
      }

      clearTimers();
      setPending(true);
      setProgress(14);
      setTargetLabel(label || '');

      tickRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 88) return p;
          const bump = p < 40 ? 10 : p < 70 ? 5 : 2;
          return Math.min(88, p + bump + Math.random() * 4);
        });
      }, 180);

      // Never stick forever if navigation is aborted
      safetyRef.current = setTimeout(() => {
        finish();
      }, 10000);
    },
    [clearTimers, finish]
  );

  // Route settled → complete
  useEffect(() => {
    if (!pending) return;
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when pathname changes
  }, [pathname]);

  // Capture internal <a> / Link clicks (sidebar, bottom nav, etc.)
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const a = e.target?.closest?.('a[href]');
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;

      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }
      if (href.startsWith('http') || href.startsWith('//')) {
        try {
          const abs = new URL(href, window.location.origin);
          if (abs.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }

      const label =
        a.getAttribute('aria-label') ||
        a.getAttribute('title') ||
        (a.textContent || '').trim().slice(0, 40) ||
        '';

      start({ href, label });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [start]);

  // Browser back/forward
  useEffect(() => {
    const onPop = () => start({ label: 'Going back' });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [start]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const value = useMemo(
    () => ({ pending, progress, targetLabel, start, finish }),
    [pending, progress, targetLabel, start, finish]
  );

  return (
    <NavProgressContext.Provider value={value}>
      {children}
    </NavProgressContext.Provider>
  );
}

export function useNavProgress() {
  return useContext(NavProgressContext);
}
