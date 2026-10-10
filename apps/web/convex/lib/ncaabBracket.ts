/**
 * NCAAB Bracket API Client
 *
 * Uses Ball Don't Lie NCAAB API: https://api.balldontlie.io/ncaab/v1/
 * Same API key as NBA endpoints.
 */

const BASE_URL = "https://api.balldontlie.io/ncaab/v1";

// ========================================
// Types
// ========================================

export interface NCAABBracketTeam {
  id: number | null;
  name: string | null;
  full_name: string | null;
  abbreviation: string | null;
  seed: number | string | null;
  score: number | null;
  winner: boolean | null;
}

export interface NCAABBracketGame {
  game_id: number | null;
  season: number;
  round: number;
  region_id: number | null;
  region_label: string | null;
  bracket_location: number | null;
  date: string | null;
  location: string | null;
  status: string;
  status_detail: string | null;
  broadcasts: string[] | null;
  home_team: NCAABBracketTeam;
  away_team: NCAABBracketTeam;
}

export interface NCAABBracketResponse {
  data: NCAABBracketGame[];
  meta: {
    next_cursor: number | null;
    per_page: number;
  };
}

export interface NCAABScoreGame {
  id: number;
  date: string | null;
  season: number;
  status: string;
  period: number;
  postseason: boolean;
  home_team: {
    id: number | null;
    name: string | null;
    full_name: string | null;
    abbreviation: string | null;
    score: number | null;
  };
  away_team: {
    id: number | null;
    name: string | null;
    full_name: string | null;
    abbreviation: string | null;
    score: number | null;
  };
}

export interface NCAABConference {
  id: number;
  name: string;
  short_name: string;
}

export interface NCAABStanding {
  team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  conference: {
    id: number;
    name: string;
    short_name: string;
  };
  season: number;
  wins: number;
  losses: number;
  win_percentage: number;
  conference_wins: number;
  conference_losses: number;
  conference_win_percentage: number;
  games_behind: number;
  home_record: string;
  away_record: string;
  conference_record: string;
  playoff_seed: number | null;
}

export interface NCAABRanking {
  poll: string;
  team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  rank: number;
  points: number;
  record: string;
  trend: string | null;
  first_place_votes: number | null;
  season: number;
  week: number;
}

export interface NCAABTeamSeasonStats {
  team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  season: number;
  games: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
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
  pf: number;
}

export interface NCAABPlayerStat {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
    jersey_number: string;
  };
  team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  game: { id: number; date: string; season: number };
  min: string;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  pf: number;
  pts: number;
}

export interface NCAABPlayerSeasonStats {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
    jersey_number: string;
  };
  team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  season: number;
  games_played: number;
  min: string;
  pts: number | null;
  reb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  turnover: number | null;
  fgm: number | null;
  fga: number | null;
  fg_pct: number | null;
  fg3m: number | null;
  fg3a: number | null;
  fg3_pct: number | null;
  ftm: number | null;
  fta: number | null;
  ft_pct: number | null;
}

export interface NCAABGameDetail {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  period_detail: string;
  home_team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  visitor_team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  };
  home_score: number;
  away_score: number;
  home_score_h1: number;
  away_score_h1: number;
  home_score_h2: number;
  away_score_h2: number;
  home_ot_scores: number[];
  away_ot_scores: number[];
}

export interface NCAABPlay {
  id: number;
  description: string | null;
  clock: string | null;
  period: number;
  home_score: number | null;
  away_score: number | null;
  score_value: number | null;
  scoring_play: boolean;
  order: number;
  team: {
    id: number;
    name: string;
    full_name: string;
    abbreviation: string;
  } | null;
}

// ========================================
// Constants
// ========================================

export const ROUND_LABELS: Record<number, string> = {
  0: "First Four",
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet 16",
  4: "Elite 8",
  5: "Final Four",
  6: "Championship",
};

/**
 * Derive region name from the #1 seed in that bracket quadrant.
 * bracket_location 1-8 = region A, 9-16 = region B, 17-24 = region C, 25-32 = region D.
 */
export function getRegionForLocation(bracketLocation: number): number {
  return Math.ceil(bracketLocation / 8);
}

export function deriveRegionNames(games: NCAABBracketGame[]): Record<number, string> {
  const names: Record<number, string> = {};
  // Use round 1 #1 seeds to name regions
  const round1 = games.filter((g) => g.round === 1);
  for (const game of round1) {
    const loc = game.bracket_location;
    if (loc === null) continue;
    const regionIdx = getRegionForLocation(loc);
    if (names[regionIdx]) continue;
    // The #1 seed is typically the home team at bracket_location 1, 9, 17, 25
    // seed may be a string or number depending on the API response
    const topSeed = String(game.home_team.seed) === "1"
      ? game.home_team
      : String(game.away_team.seed) === "1"
        ? game.away_team
        : null;
    if (topSeed?.name) {
      names[regionIdx] = `${topSeed.name} Region`;
    }
  }
  // Fallback
  for (let i = 1; i <= 4; i++) {
    if (!names[i]) names[i] = `Region ${i}`;
  }
  return names;
}

// ========================================
// API Client
// ========================================

export class NCAABClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(
    endpoint: string,
    params?: Record<string, string | number | number[] | undefined>
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
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
      throw new Error(`NCAAB API Error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getBracket(params?: {
    season?: number;
    per_page?: number;
    cursor?: number;
  }): Promise<NCAABBracketResponse> {
    return this.fetch<NCAABBracketResponse>("/bracket", {
      season: params?.season,
      per_page: params?.per_page ?? 100,
      cursor: params?.cursor,
    });
  }

  async getGame(gameId: number): Promise<NCAABGameDetail> {
    const result = await this.fetch<{ data: NCAABGameDetail }>(
      `/games/${gameId}`
    );
    return result.data;
  }

  async getGames(date: string): Promise<NCAABScoreGame[]> {
    const result = await this.fetch<{
      data: Array<Record<string, any>>;
      meta?: { next_cursor: number | null; per_page: number };
    }>("/games", {
      "dates[]": date,
      per_page: 100,
    });

    return (result.data ?? []).map((game) => {
      const homeTeam = game.home_team ?? {};
      const visitorTeam = game.visitor_team ?? game.away_team ?? {};

      return {
        id: game.id,
        date: game.date ?? null,
        season: game.season ?? new Date().getFullYear(),
        status: game.status ?? "",
        period: game.period ?? 0,
        postseason: Boolean(game.postseason),
        home_team: {
          id: homeTeam.id ?? null,
          name: homeTeam.name ?? null,
          full_name: homeTeam.full_name ?? null,
          abbreviation: homeTeam.abbreviation ?? null,
          score:
            game.home_team_score ??
            homeTeam.score ??
            game.home_score ??
            null,
        },
        away_team: {
          id: visitorTeam.id ?? null,
          name: visitorTeam.name ?? null,
          full_name: visitorTeam.full_name ?? null,
          abbreviation: visitorTeam.abbreviation ?? null,
          score:
            game.visitor_team_score ??
            game.away_team_score ??
            visitorTeam.score ??
            game.away_score ??
            null,
        },
      };
    });
  }

  async getPlayerStatsByGame(gameId: number): Promise<NCAABPlayerStat[]> {
    const result = await this.fetch<{
      data: NCAABPlayerStat[];
      meta: { next_cursor: number | null; per_page: number };
    }>("/player_stats", {
      "game_ids[]": gameId,
      per_page: 100,
    });
    return result.data;
  }

  async getGamePlays(gameId: number): Promise<NCAABPlay[]> {
    const plays: NCAABPlay[] = [];
    let cursor: number | undefined;

    while (true) {
      const result = await this.fetch<{
        data: NCAABPlay[];
        meta: { next_cursor: number | null; per_page: number };
      }>("/plays", {
        game_id: gameId,
        per_page: 100,
        cursor,
      });

      const page = result.data ?? [];
      plays.push(...page);
      cursor = result.meta?.next_cursor ?? undefined;
      if (cursor === undefined) break;
    }

    return plays.sort((a, b) => a.order - b.order);
  }

  async getConferences(): Promise<NCAABConference[]> {
    const result = await this.fetch<{ data: NCAABConference[] }>("/conferences");
    return result.data;
  }

  async getStandings(
    conferenceId: number,
    season?: number
  ): Promise<NCAABStanding[]> {
    const result = await this.fetch<{ data: NCAABStanding[] }>("/standings", {
      conference_id: conferenceId,
      season,
    });
    return result.data;
  }

  async getRankings(
    season: number,
    week?: number
  ): Promise<NCAABRanking[]> {
    const result = await this.fetch<{ data: NCAABRanking[] }>("/rankings", {
      season,
      week,
    });
    return result.data;
  }

  async getTeamSeasonStats(
    teamIds: number[],
    season?: number
  ): Promise<NCAABTeamSeasonStats[]> {
    const result = await this.fetch<{ data: NCAABTeamSeasonStats[] }>(
      "/team_season_stats",
      {
        "team_ids[]": teamIds,
        season,
      }
    );
    return result.data;
  }

  async getPlayerSeasonStats(
    playerId: number,
    season?: number
  ): Promise<NCAABPlayerSeasonStats | null> {
    const params: Record<string, string | number | number[] | undefined> = {
      "player_ids[]": playerId,
    };
    if (season) params.season = season;

    const result = await this.fetch<{
      data: NCAABPlayerSeasonStats[];
      meta: { next_cursor: number | null; per_page: number };
    }>("/player_season_stats", params);

    return result.data[0] ?? null;
  }

  async getFullBracket(season: number): Promise<NCAABBracketGame[]> {
    const allGames: NCAABBracketGame[] = [];
    let cursor: number | undefined;

    // Auto-paginate — bracket has ~67 games max
    while (true) {
      const response = await this.getBracket({
        season,
        per_page: 100,
        cursor,
      });

      allGames.push(...response.data);

      cursor = response.meta?.next_cursor ?? undefined;
      if (cursor === undefined) break;
    }

    return allGames;
  }
}

export function createNCAABClient(apiKey: string): NCAABClient {
  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY environment variable is not set");
  }
  return new NCAABClient(apiKey);
}
