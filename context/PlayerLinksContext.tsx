import React, { createContext, useContext, useEffect, useState } from 'react';

import type { PlayerLink, PlayerLinksMap } from '@/types';
import { storage } from '@/utils/storage';

const FREE_LINK_LIMIT = 3;
const STORAGE_KEY = 'player_links';

type PlayerLinksContextValue = {
  links: PlayerLinksMap;
  getLinksForPlayer: (playerId: string) => PlayerLink[];
  addLink: (playerId: string, url: string, title: string) => boolean;
  updateLink: (linkId: string, updates: Partial<Pick<PlayerLink, 'url' | 'title'>>) => void;
  deleteLink: (linkId: string) => void;
  reorderLinks: (playerId: string, newOrder: PlayerLink[]) => void;
  getLinkCount: (playerId: string) => number;
  isAtLimit: (playerId: string) => boolean;
};

const PlayerLinksContext = createContext<PlayerLinksContextValue | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function PlayerLinksProvider({ children }: { children: React.ReactNode }) {
  const [links, setLinks] = useState<PlayerLinksMap>({});

  useEffect(() => {
    storage.getItem<PlayerLinksMap>(STORAGE_KEY).then((saved) => {
      if (saved) {
        setLinks(saved);
      }
    });
  }, []);

  useEffect(() => {
    storage.setItem(STORAGE_KEY, links);
  }, [links]);

  const getLinksForPlayer = (playerId: string): PlayerLink[] => {
    return (links[playerId] || []).sort((a, b) => a.order - b.order);
  };

  const getLinkCount = (playerId: string): number => {
    return (links[playerId] || []).length;
  };

  const isAtLimit = (playerId: string): boolean => {
    return getLinkCount(playerId) >= FREE_LINK_LIMIT;
  };

  const addLink = (playerId: string, url: string, title: string): boolean => {
    if (isAtLimit(playerId)) {
      return false;
    }

    const playerLinks = links[playerId] || [];
    const newLink: PlayerLink = {
      id: generateId(),
      playerId,
      url,
      title,
      order: playerLinks.length,
      createdAt: Date.now(),
    };

    setLinks((prev) => ({
      ...prev,
      [playerId]: [...(prev[playerId] || []), newLink],
    }));

    return true;
  };

  const updateLink = (linkId: string, updates: Partial<Pick<PlayerLink, 'url' | 'title'>>) => {
    setLinks((prev) => {
      const newLinks = { ...prev };
      for (const playerId in newLinks) {
        const index = newLinks[playerId].findIndex((l) => l.id === linkId);
        if (index !== -1) {
          newLinks[playerId] = [...newLinks[playerId]];
          newLinks[playerId][index] = { ...newLinks[playerId][index], ...updates };
          break;
        }
      }
      return newLinks;
    });
  };

  const deleteLink = (linkId: string) => {
    setLinks((prev) => {
      const newLinks = { ...prev };
      for (const playerId in newLinks) {
        const index = newLinks[playerId].findIndex((l) => l.id === linkId);
        if (index !== -1) {
          newLinks[playerId] = newLinks[playerId].filter((l) => l.id !== linkId);
          newLinks[playerId] = newLinks[playerId].map((l, i) => ({ ...l, order: i }));
          break;
        }
      }
      return newLinks;
    });
  };

  const reorderLinks = (playerId: string, newOrder: PlayerLink[]) => {
    setLinks((prev) => ({
      ...prev,
      [playerId]: newOrder.map((link, index) => ({ ...link, order: index })),
    }));
  };

  return (
    <PlayerLinksContext.Provider
      value={{
        links,
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
