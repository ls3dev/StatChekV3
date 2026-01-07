import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';

import type { PlayerLink, PlayerLinksMap } from '@/types';
import { useUserId } from '@/providers/ConvexProvider';
import { api } from '@statchek/convex';

const FREE_LINK_LIMIT = 3;

type PlayerLinksContextValue = {
  links: PlayerLinksMap;
  isLoaded: boolean;
  getLinksForPlayer: (playerId: string) => PlayerLink[];
  addLink: (playerId: string, url: string, title: string) => Promise<boolean>;
  updateLink: (linkId: string, updates: Partial<Pick<PlayerLink, 'url' | 'title'>>) => Promise<void>;
  deleteLink: (linkId: string) => Promise<void>;
  reorderLinks: (playerId: string, newOrder: PlayerLink[]) => Promise<void>;
  getLinkCount: (playerId: string) => number;
  isAtLimit: (playerId: string) => boolean;
};

const PlayerLinksContext = createContext<PlayerLinksContextValue | undefined>(undefined);

export function PlayerLinksProvider({ children }: { children: React.ReactNode }) {
  const userId = useUserId();

  // Query all user's player links from Convex
  const allPlayerLinks = useQuery(
    api.playerLinks.getAllUserPlayerLinks,
    userId ? { userId } : 'skip'
  );

  // Mutations
  const addLinkMutation = useMutation(api.playerLinks.addPlayerLink);
  const updateLinkMutation = useMutation(api.playerLinks.updatePlayerLink);
  const deleteLinkMutation = useMutation(api.playerLinks.deletePlayerLink);
  const reorderLinksMutation = useMutation(api.playerLinks.reorderPlayerLinks);

  // Convert flat list of links to PlayerLinksMap (grouped by playerId)
  const links = useMemo<PlayerLinksMap>(() => {
    if (!allPlayerLinks) return {};

    const linksMap: PlayerLinksMap = {};

    allPlayerLinks.forEach((link) => {
      if (!linksMap[link.playerId]) {
        linksMap[link.playerId] = [];
      }

      linksMap[link.playerId].push({
        id: link._id,
        playerId: link.playerId,
        url: link.url,
        title: link.title,
        order: link.order,
        createdAt: link.createdAt,
      });
    });

    // Sort each player's links by order
    Object.keys(linksMap).forEach((playerId) => {
      linksMap[playerId].sort((a, b) => a.order - b.order);
    });

    return linksMap;
  }, [allPlayerLinks]);

  const isLoaded = allPlayerLinks !== undefined;

  const getLinksForPlayer = useCallback(
    (playerId: string): PlayerLink[] => {
      return (links[playerId] || []).sort((a, b) => a.order - b.order);
    },
    [links]
  );

  const getLinkCount = useCallback(
    (playerId: string): number => {
      return (links[playerId] || []).length;
    },
    [links]
  );

  const isAtLimit = useCallback(
    (playerId: string): boolean => {
      return getLinkCount(playerId) >= FREE_LINK_LIMIT;
    },
    [getLinkCount]
  );

  const addLink = useCallback(
    async (playerId: string, url: string, title: string): Promise<boolean> => {
      if (!userId) {
        throw new Error('User not initialized');
      }

      // Optimistic check
      if (isAtLimit(playerId)) {
        return false;
      }

      const result = await addLinkMutation({
        userId,
        playerId,
        url,
        title,
      });

      return result.success;
    },
    [userId, isAtLimit, addLinkMutation]
  );

  const updateLink = useCallback(
    async (linkId: string, updates: Partial<Pick<PlayerLink, 'url' | 'title'>>) => {
      await updateLinkMutation({
        linkId: linkId as any, // Convex ID
        updates,
      });
    },
    [updateLinkMutation]
  );

  const deleteLink = useCallback(
    async (linkId: string) => {
      await deleteLinkMutation({
        linkId: linkId as any, // Convex ID
      });
    },
    [deleteLinkMutation]
  );

  const reorderLinks = useCallback(
    async (playerId: string, newOrder: PlayerLink[]) => {
      if (!userId) {
        throw new Error('User not initialized');
      }

      // Extract link IDs in new order
      const linkIds = newOrder.map((link) => link.id as any);

      await reorderLinksMutation({
        userId,
        playerId,
        newOrder: linkIds,
      });
    },
    [userId, reorderLinksMutation]
  );

  return (
    <PlayerLinksContext.Provider
      value={{
        links,
        isLoaded,
        getLinksForPlayer,
        addLink,
        updateLink,
        deleteLink,
        reorderLinks,
        getLinkCount,
        isAtLimit,
      }}>
      {children}
    </PlayerLinksContext.Provider>
  );
}

export function usePlayerLinksContext() {
  const ctx = useContext(PlayerLinksContext);
  if (!ctx) {
    throw new Error('usePlayerLinksContext must be used within a PlayerLinksProvider');
  }
  return ctx;
}
