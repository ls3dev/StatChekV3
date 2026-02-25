/**
 * Ball Don't Lie NBA API Client
 *
 * Documentation: https://docs.balldontlie.io/
 * Rate Limit: 600 requests/minute (GOAT tier)
 *
 * API Key stored in Convex environment variable: BALLDONTLIE_API_KEY
 */

const BASE_URL = "https://api.balldontlie.io/v1";

// ========================================
// Types
// ========================================

export interface BDLTeam {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
}

export interface BDLPlayer {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string | null;
  weight: string | null;
  jersey_number: string | null;
  college: string | null;
  country: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team: BDLTeam;
}

export interface BDLStanding {
  team: BDLTeam;
  season: number;
  wins: number;
  losses: number;
  conference_rank: number;
  conference_record: string;
  division_rank: number;
  division_record: string;
  home_record: string;
  road_record: string;
}

export interface BDLGame {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: BDLTeam;
  home_team_score: number;
  visitor_team: BDLTeam;
  visitor_team_score: number;
}

export interface BDLSeasonAverages {
  player_id: number;
  season: number;
  games_played: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
}

export interface BDLAdvancedStats {
  player_id: number;
  season: number;
  pie: number; // Player Impact Estimate
  pace: number;
  per: number; // Player Efficiency Rating
  usg_pct: number; // Usage Rate
  ts_pct: number; // True Shooting %
  efg_pct: number; // Effective FG%
  ast_pct: number;
  reb_pct: number;
  oreb_pct: number;
  dreb_pct: number;
  stl_pct: number;
  blk_pct: number;
  tov_pct: number;
  net_rating: number;
  off_rating: number;
  def_rating: number;
}

export interface BDLContract {
  player: BDLPlayer;
  season: number;
  amount: number;
  currency: string;
  team: BDLTeam;
}

export interface BDLInjury {
  player: BDLPlayer;
  team: BDLTeam;
  status: string;
  description: string;
  return_date: string | null;
}

export interface BDLLeader {
  player: BDLPlayer;
  value: number;
  rank: number;
}

export interface BDLPaginatedResponse<T> {
  data: T[];
  meta: {
    next_cursor: number | null;
    per_page: number;
  };
}

export interface BDLError {
  error: string;
  message: string;
}

// ========================================
// API Client
// ========================================

class BallDontLieClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(
    endpoint: string,
    params?: Record<string, string | number | undefined>
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: this.apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }
      if (response.status === 401) {
        throw new Error("INVALID_API_KEY");
      }
      if (response.status === 403) {
        throw new Error("PAYWALL_FEATURE");
      }
      const errorData = (await response.json()) as BDLError;
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // ========================================
  // FREE Endpoints
  // ========================================

  /**
   * Get standings for a season
   * Cache: 5 minutes
   */
  async getStandings(season: number): Promise<BDLStanding[]> {
    const response = await this.fetch<BDLPaginatedResponse<BDLStanding>>(
      "/standings",
      { season }
    );
    return response.data;
  }

  /**
   * Get games for a specific date
   * Cache: 2 minutes (live), 24 hours (past)
   */
  async getGames(params: {
    date?: string; // YYYY-MM-DD
    season?: number;
    team_ids?: number[];
    per_page?: number;
    cursor?: number;
  }): Promise<BDLPaginatedResponse<BDLGame>> {
    const queryParams: Record<string, string | number | undefined> = {
      per_page: params.per_page ?? 100,
      cursor: params.cursor,
    };

    // Add dates array
    if (params.date) {
      queryParams["dates[]"] = params.date;
    }
    if (params.season) {
      queryParams.season = params.season;
    }
    if (params.team_ids?.length) {
      // BDL uses team_ids[] for multiple teams
      queryParams["team_ids[]"] = params.team_ids[0];
    }

    return this.fetch<BDLPaginatedResponse<BDLGame>>("/games", queryParams);
  }

  /**
   * Get basic season averages for a player
   * Cache: 1 hour
   */
  async getSeasonAverages(
    playerId: number,
    season?: number
  ): Promise<BDLSeasonAverages | null> {
    const response = await this.fetch<BDLPaginatedResponse<BDLSeasonAverages>>(
      "/season_averages",
      {
        player_id: playerId,
        season: season ?? getCurrentNBASeason(),
      }
    );
    return response.data[0] ?? null;
  }

  /**
   * Get stat leaders
   * Cache: 1 hour
   */
  async getLeaders(params: {
    season?: number;
    stat_type?: string; // pts, reb, ast, stl, blk, fg_pct, fg3_pct, ft_pct
    per_page?: number;
  }): Promise<BDLLeader[]> {
    const response = await this.fetch<BDLPaginatedResponse<BDLLeader>>(
      "/leaders",
      {
        season: params.season,
        stat_type: params.stat_type ?? "pts",
        per_page: params.per_page ?? 25,
      }
    );
    return response.data;
  }

  /**
   * Get player by ID
   */
  async getPlayer(playerId: number): Promise<BDLPlayer | null> {
    try {
      return await this.fetch<BDLPlayer>(`/players/${playerId}`);
    } catch {
      return null;
    }
  }

  /**
   * Search players by name
   */
  async searchPlayers(
    search: string,
    perPage = 25
  ): Promise<BDLPaginatedResponse<BDLPlayer>> {
    return this.fetch<BDLPaginatedResponse<BDLPlayer>>("/players", {
      search,
      per_page: perPage,
    });
  }

  /**
   * Get all teams
   */
  async getTeams(): Promise<BDLTeam[]> {
    const response =
      await this.fetch<BDLPaginatedResponse<BDLTeam>>("/teams");
    return response.data;
  }

  /**
   * Get active players, optionally filtered by team
   * Returns players with draft info (draft_year, draft_round, draft_number)
   */
  async getActivePlayers(params?: {
    team_ids?: number[];
    per_page?: number;
    cursor?: number;
  }): Promise<BDLPaginatedResponse<BDLPlayer>> {
    const queryParams: Record<string, string | number | undefined> = {
      per_page: params?.per_page ?? 100,
      cursor: params?.cursor,
    };

    if (params?.team_ids?.length) {
      queryParams["team_ids[]"] = params.team_ids[0];
    }

    return this.fetch<BDLPaginatedResponse<BDLPlayer>>(
      "/players/active",
      queryParams
    );
  }

  // ========================================
  // PRO Endpoints (Paywalled)
  // ========================================

  /**
   * Get advanced season averages for a player
   * Cache: 1 hour
   * Requires: Pro
   */
  async getAdvancedStats(
    playerId: number,
    season?: number
  ): Promise<BDLAdvancedStats | null> {
    const response = await this.fetch<BDLPaginatedResponse<BDLAdvancedStats>>(
      "/season_averages/advanced",
      {
        player_id: playerId,
        season: season ?? getCurrentNBASeason(),
      }
    );
    return response.data[0] ?? null;
  }

  /**
   * Get player contract details
   * Cache: 24 hours
   * Requires: Pro
   */
  async getPlayerContracts(
    playerId: number
  ): Promise<BDLContract[]> {
    const response = await this.fetch<BDLPaginatedResponse<BDLContract>>(
      "/contracts/players",
      {
        player_id: playerId,
      }
    );
    return response.data;
  }

  /**
   * Get team contracts/payroll
   * Cache: 24 hours
   * Requires: Pro
   */
  async getTeamContracts(teamId: number): Promise<BDLContract[]> {
    const response = await this.fetch<BDLPaginatedResponse<BDLContract>>(
      "/contracts/teams",
      {
        team_id: teamId,
      }
    );
    return response.data;
  }

  /**
   * Get current injury reports
   * Cache: 15 minutes
   * Requires: Pro
   */
  async getInjuries(params?: {
    team_id?: number;
    player_id?: number;
    per_page?: number;
  }): Promise<BDLInjury[]> {
    const response = await this.fetch<BDLPaginatedResponse<BDLInjury>>(
      "/player_injuries",
      {
        team_id: params?.team_id,
        player_id: params?.player_id,
        per_page: params?.per_page ?? 100,
      }
    );
    return response.data;
  }
}

// ========================================
// Factory function
// ========================================

/**
 * Create a Ball Don't Lie API client
 * Use this in Convex actions to make API calls
 */
export function createBallDontLieClient(apiKey: string): BallDontLieClient {
  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY environment variable is not set");
  }
  return new BallDontLieClient(apiKey);
}

// ========================================
// Cache TTL Constants (in milliseconds)
// ========================================

export const CACHE_TTL = {
  STANDINGS: 5 * 60 * 1000, // 5 minutes
  GAMES_LIVE: 2 * 60 * 1000, // 2 minutes
  GAMES_PAST: 24 * 60 * 60 * 1000, // 24 hours
  SEASON_AVERAGES: 60 * 60 * 1000, // 1 hour
  CONTRACTS: 24 * 60 * 60 * 1000, // 24 hours
  INJURIES: 15 * 60 * 1000, // 15 minutes
  LEADERS: 60 * 60 * 1000, // 1 hour
  DRAFT_PICKS: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Check if cached data is still valid
 */
export function isCacheValid(cachedAt: number, ttl: number): boolean {
  return Date.now() - cachedAt < ttl;
}

/**
 * Get current NBA season (season year starts in October)
 */
export function getCurrentNBASeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 0-indexed
  // NBA season starts in October, so if we're before October, we're in last year's season
  return month >= 10 ? year : year - 1;
}

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split("T")[0];
}
