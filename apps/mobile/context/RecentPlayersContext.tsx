import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';

import type { Player } from '@/types';
import { useUserId } from '@/providers/ConvexProvider';
import { api } from '@statchek/convex';

const MAX_RECENT_PLAYERS = 10;

type RecentPlayersContextType = {
  recentPlayers: Player[];
  addRecentPlayer: (player: Player) => Promise<void>;
  clearRecentPlayers: () => Promise<void>;
  isLoaded: boolean;
};

const RecentPlayersContext = createContext<RecentPlayersContextType | undefined>(undefined);

type RecentPlayersProviderProps = {
  children: React.ReactNode;
};

export function RecentPlayersProvider({ children }: RecentPlayersProviderProps) {
  const userId = useUserId();

  // Query recent players from Convex
  const convexRecentPlayers = useQuery(
    api.recentPlayers.getRecentPlayers,
    userId ? { userId, limit: MAX_RECENT_PLAYERS } : 'skip'
  );

  // Mutations
  const addRecentPlayerMutation = useMutation(api.recentPlayers.addRecentPlayer);
  const clearRecentPlayersMutation = useMutation(api.recentPlayers.clearRecentPlayers);

  // Convert Convex recent players to Player format
  const recentPlayers = useMemo<Player[]>(() => {
    if (!convexRecentPlayers) return [];

    return convexRecentPlayers.map((recent) => ({
      id: recent.playerId,
      name: recent.name,
      sport: recent.sport,
      team: recent.team,
      position: recent.position,
      number: recent.number,
      photoUrl: recent.photoUrl,
      sportsReferenceUrl: recent.sportsReferenceUrl,
      hallOfFame: recent.hallOfFame,
    }));
  }, [convexRecentPlayers]);

  const isLoaded = convexRecentPlayers !== undefined;

  const addRecentPlayer = useCallback(
    async (player: Player) => {
      if (!userId) {
        throw new Error('User not initialized');
      }

      await addRecentPlayerMutation({
        userId,
        player,
      });
    },
    [userId, addRecentPlayerMutation]
  );

  const clearRecentPlayers = useCallback(async () => {
    if (!userId) {
      throw new Error('User not initialized');
    }

    await clearRecentPlayersMutation({ userId });
  }, [userId, clearRecentPlayersMutation]);

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
