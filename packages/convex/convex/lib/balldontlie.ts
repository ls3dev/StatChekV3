/**
 * Ball Don't Lie NBA API Client
 *
 * Documentation: https://docs.balldontlie.io/
 * Rate Limit: 600 requests/minute (GOAT tier)
 *
 * API Key stored in Convex environment variable: BALLDONTLIE_API_KEY
 */

const BASE_URL = "https://api.balldontlie.io/v1";
const NBA_BASE_URL = "https://api.balldontlie.io/nba/v1";

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

export interface BDLTeamBasicSeasonAverages {
  team_id: number;
  season: number;
  gp: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  oreb: number;
  dreb: number;
  w: number;
  l: number;
  w_pct: number;
}

// API response fields for per-game advanced stats
interface BDLAdvancedStatsGame {
  id: number;
  pie: number;
  pace: number;
  usage_percentage: number;
  true_shooting_percentage: number;
  effective_field_goal_percentage: number;
  assist_percentage: number;
  assist_ratio: number;
  assist_to_turnover: number;
  rebound_percentage: number;
  offensive_rebound_percentage: number;
  defensive_rebound_percentage: number;
  steal_percentage?: number;
  block_percentage?: number;
  turnover_ratio: number;
  net_rating: number;
  offensive_rating: number;
  defensive_rating: number;
  player: BDLPlayer;
  team: BDLTeam;
  game: BDLGame;
}

// Aggregated season averages (what we return)
export interface BDLAdvancedStats {
  player_id: number;
  season: number;
  pie: number; // Player Impact Estimate
  pace: number;
  per: number; // Player Efficiency Rating (not in API, calculated)
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

export interface BDLPlayerBoxScore {
  player: BDLPlayer;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg_pct: number;
  fg3m: number;
  fg3a: number;
  fg3_pct: number;
  ftm: number;
  fta: number;
  ft_pct: number | null;
  oreb: number;
  dreb: number;
  turnover: number;
  pf: number;
  plus_minus: number | null;
}

export interface BDLBoxScoreTeam extends BDLTeam {
  players: BDLPlayerBoxScore[];
}

export interface BDLBoxScore {
  date: string;
  datetime: string;
  home_team: BDLBoxScoreTeam;
  home_team_score: number;
  visitor_team: BDLBoxScoreTeam;
  visitor_team_score: number;
  home_q1: number;
  home_q2: number;
  home_q3: number;
  home_q4: number;
  home_ot1: number | null;
  home_ot2: number | null;
  home_ot3: number | null;
  visitor_q1: number;
  visitor_q2: number;
  visitor_q3: number;
  visitor_q4: number;
  visitor_ot1: number | null;
  visitor_ot2: number | null;
  visitor_ot3: number | null;
  home_in_bonus: boolean;
  visitor_in_bonus: boolean;
}

export interface BDLPlay {
  id: number;
  description: string | null;
  clock: string | null;
  period: number;
  home_score: number | null;
  away_score: number | null;
  score_value: number | null;
  scoring_play: boolean;
  order: number;
  team: BDLTeam | null;
}

export interface BDLTeamSeasonAverages {
  team_id: number;
  season: number;
  season_type: string;
  games: number;
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
  min: string;
  plus_minus: number;
  win_pct: number;
  losses: number;
  wins: number;
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
    params?: Record<string, string | number | (string | number)[] | undefined>,
    baseUrl = BASE_URL
  ): Promise<T> {
    const url = new URL(`${baseUrl}${endpoint}`);

    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((entry) => {
              url.searchParams.append(key, String(entry));
            });
            return;
          }

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
   * Get team season averages for one or more teams.
   * Uses the NBA namespace endpoint from Ball Don't Lie.
   */
  async getTeamSeasonAverages(params: {
    season?: number;
    teamIds: number[];
    seasonType?: "regular" | "playoffs";
  }): Promise<BDLTeamSeasonAverages[]> {
    const response = await this.fetch<
      BDLPaginatedResponse<
        | BDLTeamSeasonAverages
        | {
            team: { id: number };
            season: number;
            season_type: string;
            stats: {
              gp: number;
              pts: number;
              reb: number;
              ast: number;
              stl: number;
              blk: number;
              tov: number;
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
              min: string;
              plus_minus: number;
              w_pct: number;
              l: number;
              w: number;
            };
          }
      >
    >(
      "/team_season_averages/general",
      {
        season: params.season,
        "team_ids[]": params.teamIds,
        season_type: params.seasonType ?? "regular",
        type: "base",
        per_page: params.teamIds.length || 2,
      },
      NBA_BASE_URL
    );

    return response.data.map((item) => {
      if (!("stats" in item)) {
        return item;
      }

      return {
        team_id: item.team.id,
        season: item.season,
        season_type: item.season_type,
        games: item.stats.gp,
        pts: item.stats.pts,
        reb: item.stats.reb,
        ast: item.stats.ast,
        stl: item.stats.stl,
        blk: item.stats.blk,
        turnover: item.stats.tov,
        pf: item.stats.pf,
        fgm: item.stats.fgm,
        fga: item.stats.fga,
        fg_pct: item.stats.fg_pct,
        fg3m: item.stats.fg3m,
        fg3a: item.stats.fg3a,
        fg3_pct: item.stats.fg3_pct,
        ftm: item.stats.ftm,
        fta: item.stats.fta,
        ft_pct: item.stats.ft_pct,
        oreb: item.stats.oreb,
        dreb: item.stats.dreb,
        min: item.stats.min,
        plus_minus: item.stats.plus_minus,
        win_pct: item.stats.w_pct,
        losses: item.stats.l,
        wins: item.stats.w,
      };
    });
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
   * Get team basic season averages (PPG/RPG/APG/etc)
   */
  async getTeamBasicSeasonAverages(
    teamId: number,
    season?: number
  ): Promise<BDLTeamBasicSeasonAverages | null> {
    const stats = (
      await this.getTeamSeasonAverages({
        season: season ?? getCurrentNBASeason(),
        teamIds: [teamId],
        seasonType: "regular",
      })
    )[0];
    if (!stats) {
      return null;
    }

    return {
      team_id: stats.team_id,
      season: stats.season,
      gp: stats.games,
      min: stats.min,
      pts: stats.pts,
      reb: stats.reb,
      ast: stats.ast,
      stl: stats.stl,
      blk: stats.blk,
      tov: stats.turnover,
      fg_pct: stats.fg_pct,
      fg3_pct: stats.fg3_pct,
      ft_pct: stats.ft_pct,
      oreb: stats.oreb,
      dreb: stats.dreb,
      w: stats.wins,
      l: stats.losses,
      w_pct: stats.win_pct,
    };
  }

  // ========================================
  // PRO Endpoints (Paywalled)
  // ========================================

  /**
   * Get advanced season averages for a player
   * NOTE: The API returns per-game stats, so we aggregate them into season averages
   * Cache: 1 hour
   * Requires: Pro
   */
  async getAdvancedStats(
    playerId: number,
    season?: number
  ): Promise<BDLAdvancedStats | null> {
    try {
      const targetSeason = season ?? getCurrentNBASeason();
      const response = await this.fetch<BDLPaginatedResponse<BDLAdvancedStatsGame>>(
        "/stats/advanced",
        {
          "player_ids[]": playerId,
          season: targetSeason,
          per_page: 100, // Get more games for better averaging
        }
      );

      const games = response.data;
      if (!games || games.length === 0) {
        return null;
      }

      // Aggregate all game stats into season averages
      const numGames = games.length;
      const sum = games.reduce(
        (acc, game) => ({
          pie: acc.pie + (game.pie || 0),
          pace: acc.pace + (game.pace || 0),
          usg_pct: acc.usg_pct + (game.usage_percentage || 0),
          ts_pct: acc.ts_pct + (game.true_shooting_percentage || 0),
          efg_pct: acc.efg_pct + (game.effective_field_goal_percentage || 0),
          ast_pct: acc.ast_pct + (game.assist_percentage || 0),
          reb_pct: acc.reb_pct + (game.rebound_percentage || 0),
          oreb_pct: acc.oreb_pct + (game.offensive_rebound_percentage || 0),
          dreb_pct: acc.dreb_pct + (game.defensive_rebound_percentage || 0),
          stl_pct: acc.stl_pct + (game.steal_percentage || 0),
          blk_pct: acc.blk_pct + (game.block_percentage || 0),
          tov_pct: acc.tov_pct + (game.turnover_ratio || 0),
          net_rating: acc.net_rating + (game.net_rating || 0),
          off_rating: acc.off_rating + (game.offensive_rating || 0),
          def_rating: acc.def_rating + (game.defensive_rating || 0),
        }),
        {
          pie: 0,
          pace: 0,
          usg_pct: 0,
          ts_pct: 0,
          efg_pct: 0,
          ast_pct: 0,
          reb_pct: 0,
          oreb_pct: 0,
          dreb_pct: 0,
          stl_pct: 0,
          blk_pct: 0,
          tov_pct: 0,
          net_rating: 0,
          off_rating: 0,
          def_rating: 0,
        }
      );

      // Return averaged stats (PER is not available from API)
      return {
        player_id: playerId,
        season: targetSeason,
        pie: sum.pie / numGames,
        pace: sum.pace / numGames,
        per: 0, // PER not available from this endpoint
        usg_pct: sum.usg_pct / numGames,
        ts_pct: sum.ts_pct / numGames,
        efg_pct: sum.efg_pct / numGames,
        ast_pct: sum.ast_pct / numGames,
        reb_pct: sum.reb_pct / numGames,
        oreb_pct: sum.oreb_pct / numGames,
        dreb_pct: sum.dreb_pct / numGames,
        stl_pct: sum.stl_pct / numGames,
        blk_pct: sum.blk_pct / numGames,
        tov_pct: sum.tov_pct / numGames,
        net_rating: sum.net_rating / numGames,
        off_rating: sum.off_rating / numGames,
        def_rating: sum.def_rating / numGames,
      };
    } catch (error) {
      // Advanced stats endpoint may not be available for all players
      console.warn("Advanced stats not available:", error);
      return null;
    }
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

  /**
   * Get box scores for a specific date
   * Returns game-level box scores with nested player stats
   */
  async getBoxScores(date: string): Promise<BDLBoxScore[]> {
    const response = await this.fetch<BDLPaginatedResponse<BDLBoxScore>>(
      "/box_scores",
      { date }
    );
    return response.data;
  }

  /**
   * Get live box scores for games currently in progress
   * Returns real-time player stats during live games
   */
  async getLiveBoxScores(): Promise<BDLBoxScore[]> {
    const response = await this.fetch<BDLPaginatedResponse<BDLBoxScore>>(
      "/box_scores/live"
    );
    return response.data;
  }

  /**
   * Get play-by-play for a specific game
   * Returns all plays in chronological order
   */
  async getGamePlays(gameId: number): Promise<BDLPlay[]> {
    const plays: BDLPlay[] = [];
    let cursor: number | undefined;

    while (true) {
      const response = await this.fetch<
        BDLPaginatedResponse<BDLPlay> | { data: BDLPlay[]; meta?: { next_cursor?: number | null } } | BDLPlay[]
      >(
        "/plays",
        {
          game_id: gameId,
          per_page: 100,
          cursor,
        }
      );

      const page = Array.isArray(response) ? response : response.data ?? [];
      plays.push(...page);

      cursor = Array.isArray(response) ? undefined : response.meta?.next_cursor ?? undefined;
      if (cursor === undefined) {
        break;
      }
    }

    return plays.sort((a, b) => a.order - b.order);
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
