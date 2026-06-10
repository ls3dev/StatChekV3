import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useSport, Sport } from '@/context/SportContext';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { getAllPlayers } from '@/services/playerData';
import type { Player } from '@/types';

export type { Sport } from '@/context/SportContext';

const SPORT_STORAGE_KEY = '@selected_sport';
const FREE_SEARCH_LIMIT = 5;

// Lazy-loaded player data to avoid blocking app startup
let nflPlayers: Player[] | null = null;
let mlbPlayers: Player[] | null = null;

const getPlayersBySport = (sport: Sport): Player[] => {
  switch (sport) {
    case 'NBA':
      return getAllPlayers().filter(p => p.sport === 'NBA');
    case 'NFL':
      if (!nflPlayers) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        nflPlayers = require('@/data/nfl_players.json') as Player[];
      }
      return nflPlayers;
    case 'MLB':
      if (!mlbPlayers) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        mlbPlayers = require('@/data/mlb_players.json') as Player[];
      }
      return mlbPlayers;
  }
};

export function usePlayerSearch() {
  const [query, setQuery] = useState('');
  const { selectedSport, setSelectedSport } = useSport();
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const { isProUser } = useRevenueCat();
  const lastQuery = useRef('');

  const searchLimitReached = !isProUser && searchCount >= FREE_SEARCH_LIMIT;

  // Load saved sport preference on mount (only once)
  useEffect(() => {
    const loadSavedSport = async () => {
      try {
        const saved = await AsyncStorage.getItem(SPORT_STORAGE_KEY);
        if (saved && (saved === 'NBA' || saved === 'NFL' || saved === 'MLB')) {
          setSelectedSport(saved as Sport);
        }
      } catch (error) {
        console.warn('Failed to load saved sport:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedSport();
  }, [setSelectedSport]);

  // Save sport preference when it changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(SPORT_STORAGE_KEY, selectedSport).catch((error) => {
        console.warn('Failed to save sport preference:', error);
      });
    }
  }, [selectedSport, isLoaded]);

  // Count searches — increment when query goes from empty to non-empty
  const handleSetQuery = (newQuery: string) => {
    if (!isProUser && newQuery.trim().length > 0 && lastQuery.current.trim().length === 0) {
      setSearchCount((c) => c + 1);
    }
    lastQuery.current = newQuery;
    setQuery(newQuery);
  };

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    if (searchLimitReached) return [];

    const players = getPlayersBySport(selectedSport);
    return players.filter((player) => {
      const haystack = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [selectedSport, query, searchLimitReached]);

  const handleSportChange = (sport: Sport) => {
    setSelectedSport(sport);
    setQuery(''); // Clear search when switching sports
  };

  return {
    query,
    setQuery: handleSetQuery,
    results,
    selectedSport,
    setSelectedSport: handleSportChange,
    searchLimitReached,
  };
}
