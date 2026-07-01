'use client';

import { useEffect } from 'react';

export function useTitle(title) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | Svay`;
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
