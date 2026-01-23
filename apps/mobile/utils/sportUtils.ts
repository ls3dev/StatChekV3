import { SPORT_THEMES, SportType } from '@/constants/theme';

/**
 * Determines the dominant sport from a list of players
 * Returns the sport with the most players, or null if no players
 */
export function getListSport(players?: { sport?: string }[]): SportType | null {
  if (!players || players.length === 0) return null;

  const sportCounts: Record<string, number> = {};
  players.forEach((p) => {
    if (p.sport) {
      sportCounts[p.sport] = (sportCounts[p.sport] || 0) + 1;
    }
  });

  const entries = Object.entries(sportCounts);
  if (entries.length === 0) return null;

  const [dominantSport] = entries.sort(([, a], [, b]) => b - a);

  // Validate it's a known sport
  if (dominantSport[0] === 'NBA' || dominantSport[0] === 'NFL' || dominantSport[0] === 'MLB') {
    return dominantSport[0] as SportType;
  }

  return null;
}

/**
 * Gets the theme for a sport, falling back to default
 */
export function getSportTheme(sport: SportType | null) {
  return sport ? SPORT_THEMES[sport] : SPORT_THEMES.default;
}
