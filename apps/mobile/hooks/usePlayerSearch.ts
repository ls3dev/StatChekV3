import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

import mlbPlayersData from '@/data/mlb_players.json';
import nbaPlayersData from '@/data/nba_playersv2.json';
import nflPlayersData from '@/data/nfl_players.json';
import type { Player } from '@/types';

export type Sport = 'NBA' | 'NFL' | 'MLB';

const SPORT_STORAGE_KEY = '@selected_sport';

const playersBySport: Record<Sport, Player[]> = {
  NBA: nbaPlayersData as Player[],
  NFL: nflPlayersData as Player[],
  MLB: mlbPlayersData as Player[],
};

export function usePlayerSearch() {
  const [query, setQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<Sport>('NBA');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved sport preference on mount
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
  }, []);

  // Save sport preference when it changes
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(SPORT_STORAGE_KEY, selectedSport).catch((error) => {
        console.warn('Failed to save sport preference:', error);
      });
    }
  }, [selectedSport, isLoaded]);

  const players = playersBySport[selectedSport];

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return players.filter((player) => {
      const haystack = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [players, query]);

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
