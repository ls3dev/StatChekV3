import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { Player } from '@/types';

const RECENT_PLAYERS_STORAGE_KEY = '@statchek_recent_players';
const MAX_RECENT_PLAYERS = 10;

type RecentPlayersContextType = {
  recentPlayers: Player[];
  addRecentPlayer: (player: Player) => void;
  clearRecentPlayers: () => void;
  isLoaded: boolean;
};

const RecentPlayersContext = createContext<RecentPlayersContextType | undefined>(undefined);

type RecentPlayersProviderProps = {
  children: React.ReactNode;
};

export function RecentPlayersProvider({ children }: RecentPlayersProviderProps) {
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved recent players on mount
  useEffect(() => {
    const loadRecentPlayers = async () => {
      try {
        const saved = await AsyncStorage.getItem(RECENT_PLAYERS_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRecentPlayers(parsed);
          }
        }
      } catch (error) {
        console.warn('Failed to load recent players:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadRecentPlayers();
  }, []);

  // Persist recent players when they change
  const saveRecentPlayers = useCallback(async (players: Player[]) => {
    try {
      await AsyncStorage.setItem(RECENT_PLAYERS_STORAGE_KEY, JSON.stringify(players));
    } catch (error) {
      console.warn('Failed to save recent players:', error);
    }
  }, []);

  const addRecentPlayer = useCallback(
    (player: Player) => {
      setRecentPlayers((prev) => {
        // Remove player if already exists (we'll add to front)
        const filtered = prev.filter((p) => p.id !== player.id);
        // Add to front, limit to max
        const updated = [player, ...filtered].slice(0, MAX_RECENT_PLAYERS);
        saveRecentPlayers(updated);
        return updated;
      });
    },
    [saveRecentPlayers]
  );

  const clearRecentPlayers = useCallback(() => {
    setRecentPlayers([]);
    saveRecentPlayers([]);
  }, [saveRecentPlayers]);

  const value: RecentPlayersContextType = {
    recentPlayers,
    addRecentPlayer,
    clearRecentPlayers,
    isLoaded,
  };

  return <RecentPlayersContext.Provider value={value}>{children}</RecentPlayersContext.Provider>;
}

export function useRecentPlayers(): RecentPlayersContextType {
  const context = useContext(RecentPlayersContext);
  if (!context) {
    throw new Error('useRecentPlayers must be used within a RecentPlayersProvider');
  }
  return context;
}
