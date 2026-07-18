'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

const ChannelContext = createContext();

export function ChannelProvider({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [channels, setChannels] = useState({ data: [], selectedId: null });
  const [userChannel, setUserChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchChannels = useCallback(async () => {
    // Skip network for logged-out / marketing visitors
    const isDemo =
      typeof document !== 'undefined' &&
      document.cookie.includes('demo_mode=true');

    if (!isDemo && isLoaded && !isSignedIn) {
      setUserChannel(null);
      setChannels({ data: [], selectedId: null });
      setLoading(false);
      return;
    }

    // Wait for Clerk before hitting protected APIs
    if (!isLoaded && !isDemo) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/youtube/channel/pin');
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = res.ok && isJson ? await res.json() : {};
      const pinnedItems = data.success ? data.items || [] : [];

      const userRes = await fetch('/api/youtube/channel/user');
      const userIsJson = userRes.headers
        .get('content-type')
        ?.includes('application/json');
      const userData = userRes.ok && userIsJson ? await userRes.json() : {};
      const primaryChannel =
        userData.success && userData.channel ? userData.channel : null;

      setUserChannel(primaryChannel);

      const allChannels = primaryChannel
        ? [
            primaryChannel,
            ...pinnedItems.filter((p) => p.id !== primaryChannel.id),
          ]
        : pinnedItems;

      setChannels((prev) => ({
        data: allChannels,
        selectedId:
          prev.selectedId ||
          (primaryChannel
            ? primaryChannel.id
            : allChannels.length > 0
              ? allChannels[0].id
              : null),
      }));
    } catch (err) {
      console.error('Failed to fetch channels for context:', err);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, isLoaded]);

  useEffect(() => {
    fetchChannels();
    window.addEventListener('refresh-pins', fetchChannels);
    return () => window.removeEventListener('refresh-pins', fetchChannels);
  }, [fetchChannels]);

  const selectChannel = (id) => {
    setChannels((prev) => ({ ...prev, selectedId: id }));
  };

  return (
    <ChannelContext.Provider
      value={{
        channels,
        userChannel,
        selectChannel,
        loading,
        refreshChannels: fetchChannels,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error('useChannel must be used within a ChannelProvider');
  }
  return context;
};
