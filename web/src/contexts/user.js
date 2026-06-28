'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';

const UserContext = createContext();

export function UserProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const [userData, setUserData] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);

  useEffect(() => {
    const checkDemo = document.cookie.includes("demo_mode=true");
    setIsDemo(checkDemo);
    setDemoLoaded(true);
  }, []);

  useEffect(() => {
    if (isDemo) {
      setUserData({
        $id: "demo-user-id",
        name: "Demo Account",
        email: "demo@vyron.ai",
        imageUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      });
    } else if (user) {
      setUserData({
        $id: user.id,
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        imageUrl: user.imageUrl,
      });
    } else {
      setUserData(null);
    }
  }, [user, isDemo]);

  const value = isDemo ? {
    user: userData,
    isLoaded: demoLoaded,
    isSignedIn: true
  } : {
    user: userData,
    isLoaded,
    isSignedIn
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

