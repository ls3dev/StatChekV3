/**
 * Basketball Reference Scraper
 *
 * Scrapes advanced stats from Basketball Reference player pages.
 * Used as fallback when Ball Don't Lie API doesn't provide accurate data.
 */

// ========================================
// Types
// ========================================

export interface BBRefAdvancedStats {
  season: string;
  per: number | null;           // Player Efficiency Rating
  ts_pct: number | null;        // True Shooting %
  efg_pct: number | null;       // Effective FG %
  usg_pct: number | null;       // Usage %
  ows: number | null;           // Offensive Win Shares
  dws: number | null;           // Defensive Win Shares
  ws: number | null;            // Win Shares
  obpm: number | null;          // Offensive Box Plus/Minus
  dbpm: number | null;          // Defensive Box Plus/Minus
  bpm: number | null;           // Box Plus/Minus
  vorp: number | null;          // Value Over Replacement Player
  ast_pct: number | null;       // Assist %
  tov_pct: number | null;       // Turnover %
  orb_pct: number | null;       // Offensive Rebound %
  drb_pct: number | null;       // Defensive Rebound %
  trb_pct: number | null;       // Total Rebound %
  stl_pct: number | null;       // Steal %
  blk_pct: number | null;       // Block %
}

// ========================================
// URL Generation
// ========================================

// Known URL overrides for players with conflicts
const BBREF_URL_OVERRIDES: Record<string, string> = {
  'jaylen brown': 'brownja02',
  'marcus morris': 'morrima03',
  'gary payton ii': 'paytoga02',
  'tim hardaway jr.': 'hardati02',
  'larry nance jr.': 'nancela02',
  'gary trent jr.': 'trentga02',
  'kenyon martin jr.': 'martike04',
  'jaren jackson jr.': 'jacksja02',
  'wendell carter jr.': 'carteje01',
  'kelly oubre jr.': 'oubreke01',
  'troy brown jr.': 'browntr01',
  'dennis smith jr.': 'smithde03',
  'lonnie walker iv': 'walkelo01',
  'kevin porter jr.': 'porteke02',
  'michael porter jr.': 'portemi01',
  'otto porter jr.': 'porteot01',
  'derrick jones jr.': 'jonesde02',
  'jaren jackson jr': 'jacksja02',
};

/**
 * Generate Basketball Reference player URL from name
 * Format: https://www.basketball-reference.com/players/[first-letter]/[last5][first2]01.html
 */
export function generateBBRefUrl(playerName: string): string {
  const normalized = playerName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim();

  // Check for known overrides first
  const override = BBREF_URL_OVERRIDES[normalized];
  if (override) {
    const firstLetter = override[0];
    return `https://www.basketball-reference.com/players/${firstLetter}/${override}.html`;
  }

  const parts = normalized.split(' ');
  if (parts.length < 2) return '';

  const firstName = parts[0];
  const lastName = parts[parts.length - 1]; // Use last part as last name

  const firstLetter = lastName[0];
  const lastNamePart = lastName.slice(0, 5);
  const firstNamePart = firstName.slice(0, 2);

  return `https://www.basketball-reference.com/players/${firstLetter}/${lastNamePart}${firstNamePart}01.html`;
}

// ========================================
// HTML Parsing
// ========================================

/**
 * Parse a numeric value from a stat cell
 */
function parseStatValue(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

/**
 * Extract a specific stat from a table row HTML
 * Handles inner text, <strong> wrapped values, and csk attribute values
 */
function extractStat(rowHtml: string, statName: string): number | null {
  // Try <strong> wrapped value first (league leaders show bold values)
  const strongRegex = new RegExp(`data-stat="${statName}"[^>]*><strong>([^<]+)</strong>`, 'i');
  const strongMatch = rowHtml.match(strongRegex);
  if (strongMatch && strongMatch[1]) {
    return parseStatValue(strongMatch[1].trim());
  }

  // Try inner text value (plain text)
  const innerTextRegex = new RegExp(`data-stat="${statName}"[^>]*>([^<]+)<`, 'i');
  const innerMatch = rowHtml.match(innerTextRegex);
  if (innerMatch && innerMatch[1] && innerMatch[1].trim()) {
    return parseStatValue(innerMatch[1].trim());
  }

  // Fallback to csk attribute (but need to handle decimal conversion)
  const cskRegex = new RegExp(`data-stat="${statName}"[^>]*csk="([^"]+)"`, 'i');
  const cskMatch = rowHtml.match(cskRegex);
  if (cskMatch && cskMatch[1]) {
    const val = parseStatValue(cskMatch[1]);
    // csk stores percentages as decimals, convert if needed
    if (val !== null && statName.includes('pct') && val < 1) {
      return val; // Keep as decimal for pct stats, UI will format
    }
    return val;
  }

  return null;
}

/**
 * Get current NBA season string (e.g., "2025-26")
 */
export function getCurrentSeasonString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // NBA season starts in October
  if (month >= 10) {
    return `${year}-${(year + 1).toString().slice(2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(2)}`;
  }
}

/**
 * Parse advanced stats from Basketball Reference HTML
 */
export function parseAdvancedStats(html: string, targetSeason?: string): BBRefAdvancedStats | null {
  const season = targetSeason || getCurrentSeasonString();

  // Find the advanced stats table
  const advancedTableMatch = html.match(/id="advanced".*?<\/table>/s);
  if (!advancedTableMatch) {
    console.warn('Could not find advanced stats table');
    return null;
  }

  const advancedTable = advancedTableMatch[0];

  // Find all rows in the table
  const rowMatches = advancedTable.match(/<tr[^>]*>.*?<\/tr>/gs);
  if (!rowMatches) {
    console.warn('Could not find rows in advanced stats table');
    return null;
  }

  // Find the row for the target season
  // Season can appear as >2025-26< or >2025-26</a> (linked)
  let targetRow: string | null = null;
  const seasonPattern = new RegExp(`>${season}(<|</a>)`, 'i');
  for (const row of rowMatches) {
    if (seasonPattern.test(row)) {
      targetRow = row;
      // Don't break - we want the last match (most recent, in case of trades)
    }
  }

  if (!targetRow) {
    console.warn(`Could not find stats for season ${season}`);
    return null;
  }

  // Extract all stats from the row
  return {
    season,
    per: extractStat(targetRow, 'per'),
    ts_pct: extractStat(targetRow, 'ts_pct'),
    efg_pct: extractStat(targetRow, 'efg_pct'),
    usg_pct: extractStat(targetRow, 'usg_pct'),
    ows: extractStat(targetRow, 'ows'),
    dws: extractStat(targetRow, 'dws'),
    ws: extractStat(targetRow, 'ws'),
    obpm: extractStat(targetRow, 'obpm'),
    dbpm: extractStat(targetRow, 'dbpm'),
    bpm: extractStat(targetRow, 'bpm'),
    vorp: extractStat(targetRow, 'vorp'),
    ast_pct: extractStat(targetRow, 'ast_pct'),
    tov_pct: extractStat(targetRow, 'tov_pct'),
    orb_pct: extractStat(targetRow, 'orb_pct'),
    drb_pct: extractStat(targetRow, 'drb_pct'),
    trb_pct: extractStat(targetRow, 'trb_pct'),
    stl_pct: extractStat(targetRow, 'stl_pct'),
    blk_pct: extractStat(targetRow, 'blk_pct'),
  };
}

/**
 * Fetch and parse advanced stats from Basketball Reference
 */
export async function fetchBBRefAdvancedStats(
  playerName: string,
  targetSeason?: string
): Promise<BBRefAdvancedStats | null> {
  const url = generateBBRefUrl(playerName);
  if (!url) {
    console.warn(`Could not generate URL for player: ${playerName}`);
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch BBRef page: ${response.status}`);
      return null;
    }

    const html = await response.text();
    return parseAdvancedStats(html, targetSeason);
  } catch (error) {
    console.error('Error fetching BBRef stats:', error);
    return null;
  }
}
