'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ChannelContext = createContext();

export function ChannelProvider({ children }) {
  const [channels, setChannels] = useState({ data: [], selectedId: null });
  const [loading, setLoading] = useState(true);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      // Fetch pinned channels as a proxy for "available channels" for now
      const res = await fetch("/api/youtube/channel/pin");
      const data = await res.json();
      if (data.success) {
        const items = data.items || [];
        setChannels(prev => ({
          data: items,
          selectedId: items.length > 0 ? (prev.selectedId || items[0].id) : null
        }));
      }
      
      // Also check for user's primary channel
      const userRes = await fetch("/api/youtube/channel/user");
      const userData = await userRes.json();
      if (userData.success && userData.channel) {
        setChannels(prev => {
          const exists = prev.data.find(c => c.id === userData.channel.id);
          const newData = exists ? prev.data : [userData.channel, ...prev.data];
          return {
            data: newData,
            selectedId: prev.selectedId || userData.channel.id
          };
        });
      }
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
    <ChannelContext.Provider value={{ channels, selectChannel, loading, refreshChannels: fetchChannels }}>
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
