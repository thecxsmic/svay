'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useUser as useClerkUser } from '@clerk/nextjs';

const UserContext = createContext();

export function UserProvider({ children }) {
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (user) {
      setUserData({
        $id: user.id,
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        imageUrl: user.imageUrl,
      });
    } else {
      setUserData(null);
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user: userData, isLoaded, isSignedIn }}>
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
