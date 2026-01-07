import { useMemo, useState } from 'react';

import playersData from '@/data/nba_playersv2.json';
import type { Player } from '@/types';

export function usePlayerSearch() {
  const [query, setQuery] = useState('');

  const players = playersData as Player[];

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return players.filter((player) => {
      const haystack = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      return haystack.includes(trimmed);
    });
  }, [players, query]);

  return {
    query,
    setQuery,
    results,
  };
}


