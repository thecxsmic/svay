'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ChannelContext = createContext();

export function ChannelProvider({ children }) {
  const [channels, setChannels] = useState({ data: [], selectedId: null });
  const [userChannel, setUserChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      // Fetch pinned channels
      const res = await fetch("/api/youtube/channel/pin");
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = res.ok && isJson ? await res.json() : {};
      const pinnedItems = data.success ? (data.items || []) : [];

      // Check for user's primary channel
      const userRes = await fetch("/api/youtube/channel/user");
      const userIsJson = userRes.headers.get("content-type")?.includes("application/json");
      const userData = userRes.ok && userIsJson ? await userRes.json() : {};
      const primaryChannel = userData.success && userData.channel ? userData.channel : null;

      setUserChannel(primaryChannel);

      const allChannels = primaryChannel
        ? [primaryChannel, ...pinnedItems.filter(p => p.id !== primaryChannel.id)]
        : pinnedItems;

      setChannels(prev => ({
        data: allChannels,
        selectedId: prev.selectedId || (primaryChannel ? primaryChannel.id : (allChannels.length > 0 ? allChannels[0].id : null))
      }));
    } catch (err) {
      console.error("Failed to fetch channels for context:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
    window.addEventListener('refresh-pins', fetchChannels);
    return () => window.removeEventListener('refresh-pins', fetchChannels);
  }, []);

  const selectChannel = (id) => {
    setChannels(prev => ({ ...prev, selectedId: id }));
  };

  return (
    <ChannelContext.Provider value={{ channels, userChannel, selectChannel, loading, refreshChannels: fetchChannels }}>
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
