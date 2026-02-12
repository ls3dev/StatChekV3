import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

import { useSport, Sport } from '@/context/SportContext';
import { getAllPlayers } from '@/services/playerData';
import type { Player } from '@/types';

export type { Sport } from '@/context/SportContext';

const SPORT_STORAGE_KEY = '@selected_sport';

// Lazy-loaded player data to avoid blocking app startup
let nflPlayers: Player[] | null = null;
let mlbPlayers: Player[] | null = null;

const getPlayersBySport = (sport: Sport): Player[] => {
  switch (sport) {
    case 'NBA':
      return getAllPlayers(); // Uses centralized service with InteractionManager
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

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const players = getPlayersBySport(selectedSport);
    return players.filter((player) => {
      const haystack = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [selectedSport, query]);

  const handleSportChange = (sport: Sport) => {
    setSelectedSport(sport);
    setQuery(''); // Clear search when switching sports
  };

  return {
    query,
    setQuery,
    results,
    selectedSport,
    setSelectedSport: handleSportChange,
  };
}
