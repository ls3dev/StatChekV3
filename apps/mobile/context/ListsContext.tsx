import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';

import type { PlayerList, PlayerListItem, PlayerListLink } from '@/types';
import { useAuth, useRequireAuth } from '@/context/AuthContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { api } from '@statcheck/convex';
import { captureException, addBreadcrumb } from '@/utils/sentry';

const FREE_LIST_LIMIT = 1;

type ListsContextValue = {
  lists: PlayerList[];
  isLoaded: boolean;
  isSyncing: boolean;
  // Paywall
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  canCreateList: boolean;
  // List CRUD
  createList: (name: string, description?: string) => Promise<PlayerList | null>;
  updateList: (id: string, updates: { name?: string; description?: string }) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  getListById: (id: string | string[] | undefined) => PlayerList | undefined;
  // Player management
  addPlayerToList: (listId: string, playerId: string) => Promise<boolean>;
  removePlayerFromList: (listId: string, playerId: string) => Promise<void>;
  reorderPlayersInList: (listId: string, newOrder: PlayerListItem[]) => Promise<void>;
  isPlayerInList: (listId: string, playerId: string) => boolean;
  // Link management
  addLinkToList: (listId: string, url: string, title: string) => Promise<void>;
  updateLinkInList: (listId: string, linkId: string, updates: { url?: string; title?: string }) => Promise<void>;
  removeLinkFromList: (listId: string, linkId: string) => Promise<void>;
  reorderLinksInList: (listId: string, newOrder: PlayerListLink[]) => Promise<void>;
};

const ListsContext = createContext<ListsContextValue | undefined>(undefined);

export function ListsProvider({ children }: { children: React.ReactNode }) {
  const { userId, isAuthenticated, isUserReady, setShowAuthPrompt } = useAuth();
  const { isProUser } = useRevenueCat();
  const [showPaywall, setShowPaywall] = useState(false);

  // Query all user lists from Convex (real-time subscription)
  // Only query when user is fully ready to prevent race conditions
  const convexLists = useQuery(
    api.userLists.getUserLists,
    isUserReady && userId ? { userId } : 'skip'
  );

  // Mutations
  const createListMutation = useMutation(api.userLists.createList);
  const updateListMutation = useMutation(api.userLists.updateList);
  const deleteListMutation = useMutation(api.userLists.deleteList);
  const addPlayerMutation = useMutation(api.userLists.addPlayerToList);
  const removePlayerMutation = useMutation(api.userLists.removePlayerFromList);
  const reorderPlayersMutation = useMutation(api.userLists.reorderPlayersInList);
  const addLinkMutation = useMutation(api.userLists.addLinkToList);
  const updateLinkMutation = useMutation(api.userLists.updateLinkInList);
  const removeLinkMutation = useMutation(api.userLists.removeLinkFromList);
  const reorderLinksMutation = useMutation(api.userLists.reorderLinksInList);

  // Convert Convex lists to our PlayerList format
  const lists = useMemo<PlayerList[]>(() => {
    if (!convexLists) return [];

    return convexLists.map((list) => ({
      id: list._id, // Use Convex document ID as our list ID
      name: list.name,
      description: list.description,
      players: list.players ?? [],
      links: list.links ?? [],
      createdAt: list.createdAt,
      updatedAt: list.updatedAt,
    }));
  }, [convexLists]);

  const isLoaded = convexLists !== undefined;
  const isSyncing = false; // TODO: Track mutation pending state

  // Check if user can create more lists (Pro users unlimited, free users limited)
  const canCreateList = isProUser || lists.length < FREE_LIST_LIMIT;

  // Create a new list (requires authentication and checks limit)
  const createList = useCallback(
    async (name: string, description?: string): Promise<PlayerList | null> => {
      try {
        addBreadcrumb('Creating list', 'lists', { name, isAuthenticated, isProUser, listsCount: lists.length });

        // Check if user is authenticated
        if (!isAuthenticated) {
          addBreadcrumb('Auth prompt shown - user not authenticated', 'lists');
          setShowAuthPrompt(true);
          return null;
        }

        // Check list limit for non-Pro users
        if (!isProUser && lists.length >= FREE_LIST_LIMIT) {
          addBreadcrumb('Paywall shown - list limit reached', 'lists');
          setShowPaywall(true);
          return null;
        }

        if (!isUserReady || !userId) {
          console.error('User not ready');
          captureException(new Error('User not ready when creating list'), {
            context: 'createList',
            isAuthenticated,
            isUserReady,
            userId,
          });
          return null;
        }

        const listId = await createListMutation({
          userId,
          name,
          description,
        });

        addBreadcrumb('List created successfully', 'lists', { listId });

        // Return the new list (it will be in the query results soon)
        return {
          id: listId,
          name,
          description,
          players: [],
          links: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } catch (error: any) {
        console.error('Error creating list:', error);
        captureException(error, {
          context: 'createList',
          name,
          userId,
          isAuthenticated,
          isProUser,
        });
        return null;
      }
    },
    [userId, isAuthenticated, isUserReady, isProUser, lists.length, setShowAuthPrompt, createListMutation]
  );

  // Update list name/description
  const updateList = useCallback(
    async (id: string, updates: { name?: string; description?: string }) => {
      await updateListMutation({
        listId: id as any, // Convex ID
        updates,
      });
    },
    [updateListMutation]
  );

  // Delete a list
  const deleteList = useCallback(
    async (id: string) => {
      await deleteListMutation({
        listId: id as any, // Convex ID
      });
    },
    [deleteListMutation]
  );

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
      if (!list || !list.players) return false;
      return list.players.some((p) => p.playerId === playerId);
    },
    [lists]
  );

  // Add player to list (requires authentication)
  const addPlayerToList = useCallback(
    async (listId: string, playerId: string): Promise<boolean> => {
      // Check if user is authenticated and ready
      if (!isAuthenticated || !isUserReady) {
        setShowAuthPrompt(true);
        return false;
      }

      // Optimistic check
      if (isPlayerInList(listId, playerId)) {
        return false;
      }

      const result = await addPlayerMutation({
        listId: listId as any, // Convex ID
        playerId,
      });

      return result.success;
    },
    [isAuthenticated, isUserReady, setShowAuthPrompt, isPlayerInList, addPlayerMutation]
  );

  // Remove player from list
  const removePlayerFromList = useCallback(
    async (listId: string, playerId: string) => {
      await removePlayerMutation({
        listId: listId as any, // Convex ID
        playerId,
      });
    },
    [removePlayerMutation]
  );

  // Reorder players in list (for drag and drop)
  const reorderPlayersInList = useCallback(
    async (listId: string, newOrder: PlayerListItem[]) => {
      await reorderPlayersMutation({
        listId: listId as any, // Convex ID
        newOrder,
      });
    },
    [reorderPlayersMutation]
  );

  // Add link to list
  const addLinkToList = useCallback(
    async (listId: string, url: string, title: string) => {
      await addLinkMutation({
        listId: listId as any, // Convex ID
        url,
        title,
      });
    },
    [addLinkMutation]
  );

  // Update link in list
  const updateLinkInList = useCallback(
    async (listId: string, linkId: string, updates: { url?: string; title?: string }) => {
      await updateLinkMutation({
        listId: listId as any, // Convex ID
        linkId,
        updates,
      });
    },
    [updateLinkMutation]
  );

  // Remove link from list
  const removeLinkFromList = useCallback(
    async (listId: string, linkId: string) => {
      await removeLinkMutation({
        listId: listId as any, // Convex ID
        linkId,
      });
    },
    [removeLinkMutation]
  );

  // Reorder links in list
  const reorderLinksInList = useCallback(
    async (listId: string, newOrder: PlayerListLink[]) => {
      await reorderLinksMutation({
        listId: listId as any, // Convex ID
        newOrder,
      });
    },
    [reorderLinksMutation]
  );

  return (
    <ListsContext.Provider
      value={{
        lists,
        isLoaded,
        isSyncing,
        showPaywall,
        setShowPaywall,
        canCreateList,
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
