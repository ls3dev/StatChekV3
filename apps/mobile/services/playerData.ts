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
 * Call this once in _layout.tsx after initial render.
 */
export function initializePlayerData(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      // This runs after navigation animations complete
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const data = require('@/data/nba_playersv2.json') as Player[];
      playersArray = data;
      playerMap = new Map(data.map((p) => [p.id, p]));
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
