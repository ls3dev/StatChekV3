import { InteractionManager } from 'react-native';
import type { Player } from '@/types';

// Cached player data
let playerMap: Map<string, Player> | null = null;
let playersArray: Player[] | null = null;
let loadPromise: Promise<void> | null = null;

/**
 * Initialize player data after app interactions complete.
 * Uses InteractionManager to defer heavy JSON parsing until after
 * navigation animations, preventing WatchdogTermination crashes.
 *
 * Loads NBA, NFL, and MLB player data with composite keys to avoid ID collisions.
 */
export function initializePlayerData(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      // Load all sports data
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nbaData = require('@/data/nba_playersv2.json') as Player[];
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nflData = require('@/data/nfl_players.json') as Player[];
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mlbData = require('@/data/mlb_players.json') as Player[];

      // Combine all players
      const allPlayers = [...nbaData, ...nflData, ...mlbData];
      playersArray = allPlayers;

      // Create map with composite keys: sport_id
      playerMap = new Map();
      allPlayers.forEach((p) => {
        playerMap!.set(`${p.sport}_${p.id}`, p);
      });

      // Also map NBA players by original ID for backward compatibility
      // (existing lists may have numeric-only IDs)
      nbaData.forEach((p) => {
        playerMap!.set(p.id, p);
      });

      resolve();
    });
  });

  return loadPromise;
}

/**
 * Get player by ID. Returns undefined if data not loaded or player not found.
 */
export function getPlayerById(id: string): Player | undefined {
  return playerMap?.get(id);
}

/**
 * Get all players. Returns empty array if data not loaded.
 */
export function getAllPlayers(): Player[] {
  return playersArray ?? [];
}

/**
 * Check if player data is loaded.
 */
export function isPlayerDataLoaded(): boolean {
  return playerMap !== null;
}
