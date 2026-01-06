import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { PlayerList, PlayerListItem, PlayerListLink } from '@/types';
import { storage } from '@/utils/storage';

type ListsContextValue = {
  lists: PlayerList[];
  isLoaded: boolean;
  // List CRUD
  createList: (name: string, description?: string) => PlayerList;
  updateList: (id: string, updates: { name?: string; description?: string }) => void;
  deleteList: (id: string) => void;
  getListById: (id: string | string[] | undefined) => PlayerList | undefined;
  // Player management
  addPlayerToList: (listId: string, playerId: string) => boolean;
  removePlayerFromList: (listId: string, playerId: string) => void;
  reorderPlayersInList: (listId: string, newOrder: PlayerListItem[]) => void;
  isPlayerInList: (listId: string, playerId: string) => boolean;
  // Link management
  addLinkToList: (listId: string, url: string, title: string) => void;
  updateLinkInList: (listId: string, linkId: string, updates: { url?: string; title?: string }) => void;
  removeLinkFromList: (listId: string, linkId: string) => void;
  reorderLinksInList: (listId: string, newOrder: PlayerListLink[]) => void;
};

const ListsContext = createContext<ListsContextValue | undefined>(undefined);

const STORAGE_KEY = 'lists';

// Generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export function ListsProvider({ children }: { children: React.ReactNode }) {
  const [lists, setLists] = useState<PlayerList[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    storage.getItem<PlayerList[]>(STORAGE_KEY).then((saved) => {
      if (saved && Array.isArray(saved)) {
        setLists(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  // Persist to storage on change
  useEffect(() => {
    if (isLoaded) {
      storage.setItem(STORAGE_KEY, lists);
    }
  }, [lists, isLoaded]);

  // Create a new list
  const createList = useCallback((name: string, description?: string): PlayerList => {
    const now = Date.now();
    const newList: PlayerList = {
      id: generateId(),
      name,
      description,
      players: [],
      links: [],
      createdAt: now,
      updatedAt: now,
    };
    setLists((prev) => [...prev, newList]);
    return newList;
  }, []);

  // Update list name/description
  const updateList = useCallback((id: string, updates: { name?: string; description?: string }) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === id
          ? { ...list, ...updates, updatedAt: Date.now() }
          : list
      )
    );
  }, []);

  // Delete a list
  const deleteList = useCallback((id: string) => {
    setLists((prev) => prev.filter((list) => list.id !== id));
  }, []);

  // Get list by ID
  const getListById = useCallback(
    (id: string | string[] | undefined) => {
      if (!id) return undefined;
      const normalized = Array.isArray(id) ? id[0] : id;
      return lists.find((l) => l.id === normalized);
    },
    [lists]
  );

  // Check if player is already in list
  const isPlayerInList = useCallback(
    (listId: string, playerId: string) => {
      const list = lists.find((l) => l.id === listId);
      if (!list) return false;
      return list.players.some((p) => p.playerId === playerId);
    },
    [lists]
  );

  // Add player to list
  const addPlayerToList = useCallback(
    (listId: string, playerId: string): boolean => {
      // Check if already in list
      if (isPlayerInList(listId, playerId)) {
        return false;
      }

      setLists((prev) =>
        prev.map((list) => {
          if (list.id !== listId) return list;

          const newPlayer: PlayerListItem = {
            playerId,
            order: list.players.length,
            addedAt: Date.now(),
          };

          return {
            ...list,
            players: [...list.players, newPlayer],
            updatedAt: Date.now(),
          };
        })
      );
      return true;
    },
    [isPlayerInList]
  );

  // Remove player from list
  const removePlayerFromList = useCallback((listId: string, playerId: string) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;

        const filteredPlayers = list.players
          .filter((p) => p.playerId !== playerId)
          .map((p, index) => ({ ...p, order: index }));

        return {
          ...list,
          players: filteredPlayers,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  // Reorder players in list (for drag and drop)
  const reorderPlayersInList = useCallback((listId: string, newOrder: PlayerListItem[]) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;

        // Update order values based on array position
        const reorderedPlayers = newOrder.map((p, index) => ({
          ...p,
          order: index,
        }));

        return {
          ...list,
          players: reorderedPlayers,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  // Add link to list
  const addLinkToList = useCallback((listId: string, url: string, title: string) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;

        const newLink: PlayerListLink = {
          id: generateId(),
          url,
          title,
          order: list.links.length,
        };

        return {
          ...list,
          links: [...list.links, newLink],
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  // Update link in list
  const updateLinkInList = useCallback(
    (listId: string, linkId: string, updates: { url?: string; title?: string }) => {
      setLists((prev) =>
        prev.map((list) => {
          if (list.id !== listId) return list;

          return {
            ...list,
            links: list.links.map((link) =>
              link.id === linkId ? { ...link, ...updates } : link
            ),
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  // Remove link from list
  const removeLinkFromList = useCallback((listId: string, linkId: string) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;

        const filteredLinks = list.links
          .filter((l) => l.id !== linkId)
          .map((l, index) => ({ ...l, order: index }));

        return {
          ...list,
          links: filteredLinks,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  // Reorder links in list
  const reorderLinksInList = useCallback((listId: string, newOrder: PlayerListLink[]) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) return list;

        const reorderedLinks = newOrder.map((l, index) => ({
          ...l,
          order: index,
        }));

        return {
          ...list,
          links: reorderedLinks,
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  return (
    <ListsContext.Provider
      value={{
        lists,
        isLoaded,
        createList,
        updateList,
        deleteList,
        getListById,
        addPlayerToList,
        removePlayerFromList,
        reorderPlayersInList,
        isPlayerInList,
        addLinkToList,
        updateLinkInList,
        removeLinkFromList,
        reorderLinksInList,
      }}>
      {children}
    </ListsContext.Provider>
  );
}

export function useListsContext() {
  const ctx = useContext(ListsContext);
  if (!ctx) {
    throw new Error('useListsContext must be used within a ListsProvider');
  }
  return ctx;
}
