import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializePlayerData, isPlayerDataLoaded } from '@/services/playerData';

type PlayerDataContextValue = {
  isLoaded: boolean;
  isLoading: boolean;
};

const PlayerDataContext = createContext<PlayerDataContextValue | undefined>(undefined);

export function PlayerDataProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(isPlayerDataLoaded());
  const [isLoading, setIsLoading] = useState(!isPlayerDataLoaded());

  useEffect(() => {
    if (isLoaded) return;

    setIsLoading(true);
    initializePlayerData().then(() => {
      setIsLoaded(true);
      setIsLoading(false);
    });
  }, [isLoaded]);

  return (
    <PlayerDataContext.Provider value={{ isLoaded, isLoading }}>
      {children}
    </PlayerDataContext.Provider>
  );
}

export function usePlayerData() {
  const ctx = useContext(PlayerDataContext);
  if (!ctx) {
    throw new Error('usePlayerData must be used within PlayerDataProvider');
  }
  return ctx;
}
