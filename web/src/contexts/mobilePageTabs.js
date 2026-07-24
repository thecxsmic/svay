'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const MobilePageTabsContext = createContext(null);

function sameItems(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i]?.id !== b[i]?.id ||
      a[i]?.label !== b[i]?.label ||
      a[i]?.count !== b[i]?.count ||
      a[i]?.icon !== b[i]?.icon
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Holds the active page's section tabs so MobileAppShell can render them
 * as a secondary bar above the primary bottom nav (reliable hit targets).
 */
export function MobilePageTabsProvider({ children }) {
  const [config, setConfig] = useState(null);

  const setPageTabs = useCallback((next) => {
    setConfig((prev) => {
      if (
        prev &&
        next &&
        prev.value === next.value &&
        prev.onChange === next.onChange &&
        sameItems(prev.items, next.items)
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const clearPageTabs = useCallback(() => {
    setConfig((prev) => (prev == null ? prev : null));
  }, []);

  const value = useMemo(
    () => ({ config, setPageTabs, clearPageTabs }),
    [config, setPageTabs, clearPageTabs]
  );

  return (
    <MobilePageTabsContext.Provider value={value}>
      {children}
    </MobilePageTabsContext.Provider>
  );
}

export function useMobilePageTabs() {
  return useContext(MobilePageTabsContext);
}
