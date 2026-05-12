'use client';

import { useEffect } from 'react';

export function useTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | Vyron`;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
