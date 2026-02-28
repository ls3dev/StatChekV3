/**
 * NBA Team Logo URLs via ESPN CDN
 *
 * Maps Ball Don't Lie API abbreviations to ESPN CDN logo URLs.
 */

// ESPN uses slightly different abbreviations for some teams
const ESPN_ABBR_MAP: Record<string, string> = {
  GSW: 'gs',
  NOP: 'no',
  NYK: 'ny',
  SAS: 'sa',
  UTA: 'utah',
  WAS: 'wsh',
};

export function getNBATeamLogoUrl(abbreviation: string): string {
  const espnAbbr = ESPN_ABBR_MAP[abbreviation] || abbreviation.toLowerCase();
  return `https://a.espncdn.com/i/teamlogos/nba/500/${espnAbbr}.png`;
}
