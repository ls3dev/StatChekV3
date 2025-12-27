import React, { createContext, useContext, useEffect, useState } from 'react';

import type { PlayerList } from '@/types';
import { storage } from '@/utils/storage';

type ListsContextValue = {
  lists: PlayerList[];
  addList: (list: PlayerList) => void;
  getListById: (id: string | string[] | undefined) => PlayerList | undefined;
};

const ListsContext = createContext<ListsContextValue | undefined>(undefined);

const STORAGE_KEY = 'lists';

export function ListsProvider({ children }: { children: React.ReactNode }) {
  const [lists, setLists] = useState<PlayerList[]>([]);

  useEffect(() => {
    storage.getItem<PlayerList[]>(STORAGE_KEY).then((saved) => {
      if (saved) {
        setLists(saved);
      }
    });
  }, []);

  useEffect(() => {
    storage.setItem(STORAGE_KEY, lists);
  }, [lists]);

  const addList = (list: PlayerList) => {
    setLists((prev) => [...prev, list]);
  };

  const getListById = (id: string | string[] | undefined) => {
    if (!id) return undefined;
    const normalized = Array.isArray(id) ? id[0] : id;
    return lists.find((l) => l.id === normalized);
  };

  return (
    <ListsContext.Provider value={{ lists, addList, getListById }}>
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


