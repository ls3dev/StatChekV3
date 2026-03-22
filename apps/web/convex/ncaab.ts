import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { isCacheValid } from "./lib/balldontlie";
import {
  createNCAABClient,
  type NCAABBracketGame,
  type NCAABGameDetail,
  type NCAABPlay,
  type NCAABScoreGame,
  type NCAABPlayerStat,
  type NCAABStanding,
  type NCAABRanking,
  type NCAABTeamSeasonStats,
  type NCAABPlayerSeasonStats,
} from "./lib/ncaabBracket";

// ========================================
// Cache TTLs
// ========================================

const BRACKET_TTL_ACTIVE = 5 * 60 * 1000; // 5 min during March/April
const BRACKET_TTL_OFFSEASON = 60 * 60 * 1000; // 1 hour off-season
const STANDINGS_TTL = 5 * 60 * 1000; // 5 min
const RANKINGS_TTL = 60 * 60 * 1000; // 1 hour

function getBracketTTL(): number {
  const month = new Date().getMonth() + 1;
  return month === 3 || month === 4 ? BRACKET_TTL_ACTIVE : BRACKET_TTL_OFFSEASON;
}

// ========================================
// Internal Queries / Mutations
// ========================================

export const _getBracketCache = internalQuery({
  args: { season: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ncaabBracketCache")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .first();
  },
});

export const _upsertBracketCache = internalMutation({
  args: { season: v.number(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ncaabBracketCache")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        cachedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("ncaabBracketCache", {
        season: args.season,
        data: args.data,
        cachedAt: Date.now(),
      });
    }
  },
});

// ========================================
// Public Action
// ========================================

export const getBracket = action({
  args: { season: v.optional(v.number()) },
  handler: async (
    ctx,
    args
  ): Promise<{ games: NCAABBracketGame[]; cachedAt: number }> => {
    // Tournament happens in March — default to current year.
    // If the API returns empty for the current year, fall back to previous year.
    const season = args.season ?? new Date().getFullYear();

    // Check cache
    const cached = await ctx.runQuery(internal.ncaab._getBracketCache, {
      season,
    });

    const cachedGames = cached?.data as NCAABBracketGame[] | undefined;
    if (
      cached &&
      isCacheValid(cached.cachedAt, getBracketTTL()) &&
      cachedGames &&
      cachedGames.length > 0
    ) {
      return {
        games: cachedGames,
        cachedAt: cached.cachedAt,
      };
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createNCAABClient(apiKey);
    let games = await client.getFullBracket(season);

    // If current year returns empty, fall back to previous year
    if (games.length === 0 && !args.season) {
      const fallbackSeason = season - 1;
      const fallbackCached = await ctx.runQuery(
        internal.ncaab._getBracketCache,
        { season: fallbackSeason }
      );
      if (
        fallbackCached &&
        isCacheValid(fallbackCached.cachedAt, getBracketTTL())
      ) {
        return {
          games: fallbackCached.data as NCAABBracketGame[],
          cachedAt: fallbackCached.cachedAt,
        };
      }
      games = await client.getFullBracket(fallbackSeason);
      if (games.length > 0) {
        await ctx.runMutation(internal.ncaab._upsertBracketCache, {
          season: fallbackSeason,
          data: games,
        });
        return { games, cachedAt: Date.now() };
      }
    }

    // Update cache
    await ctx.runMutation(internal.ncaab._upsertBracketCache, {
      season,
      data: games,
    });

    return { games, cachedAt: Date.now() };
  },
});

export const getGameDetail = action({
  args: { gameId: v.number() },
  handler: async (
    _ctx,
    args
  ): Promise<{ game: NCAABGameDetail; playerStats: NCAABPlayerStat[] }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createNCAABClient(apiKey);
    const [game, playerStats] = await Promise.all([
      client.getGame(args.gameId),
      client.getPlayerStatsByGame(args.gameId),
    ]);

    return { game, playerStats };
  },
});

export const getGamePlays = action({
  args: { gameId: v.number() },
  handler: async (
    _ctx,
    args
  ): Promise<{ plays: NCAABPlay[]; cachedAt: number }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createNCAABClient(apiKey);
    const plays = await client.getGamePlays(args.gameId);

    return { plays, cachedAt: Date.now() };
  },
});

export const getGameRuns = action({
  args: { gameIds: v.array(v.number()) },
  handler: async (
    _ctx,
    args
  ): Promise<{
    runsByGameId: Record<string, { team: "home" | "visitor"; points: number } | null>;
    cachedAt: number;
  }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createNCAABClient(apiKey);
    const uniqueGameIds = Array.from(new Set(args.gameIds)).filter((id) => Number.isFinite(id));

    const runEntries = await Promise.all(
      uniqueGameIds.map(async (gameId) => {
        try {
          const [game, plays] = await Promise.all([
            client.getGame(gameId),
            client.getGamePlays(gameId),
          ]);

          let activeTeamSide: "home" | "visitor" | null = null;
          let activePoints = 0;
          let prevPlay: NCAABPlay | undefined;

          const scoringPlays = plays
            .filter((p) => p.scoring_play)
            .sort((a, b) => a.order - b.order);

          for (const play of scoringPlays) {
            const teamId = play.team?.id;
            const side =
              teamId === game.home_team.id
                ? "home"
                : teamId === game.visitor_team.id
                  ? "visitor"
                  : null;
            if (!side) continue;

            let points = play.score_value ?? 0;
            if (points <= 0 && prevPlay) {
              const curr = side === "home" ? play.home_score : play.away_score;
              const prev = side === "home" ? prevPlay.home_score : prevPlay.away_score;
              points = Math.max(0, (curr ?? 0) - (prev ?? 0));
            }
            prevPlay = play;
            if (points <= 0) continue;

            if (activeTeamSide === side) {
              activePoints += points;
            } else {
              activeTeamSide = side;
              activePoints = points;
            }
          }

          return [
            String(gameId),
            activeTeamSide && activePoints > 0
              ? { team: activeTeamSide, points: activePoints }
              : null,
          ] as const;
        } catch {
          return [String(gameId), null] as const;
        }
      })
    );

    return {
      runsByGameId: Object.fromEntries(runEntries),
      cachedAt: Date.now(),
    };
  },
});

export const getGames = action({
  args: { date: v.string() },
  handler: async (
    _ctx,
    args
  ): Promise<{ games: NCAABScoreGame[]; cachedAt: number }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createNCAABClient(apiKey);
    const games = await client.getGames(args.date);

    return { games, cachedAt: Date.now() };
  },
});

// ========================================
// Standings
// ========================================

export const _getStandingsCache = internalQuery({
  args: { season: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ncaabStandingsCache")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .first();
  },
});

export const _upsertStandingsCache = internalMutation({
  args: { season: v.number(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ncaabStandingsCache")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data, cachedAt: Date.now() });
    } else {
      await ctx.db.insert("ncaabStandingsCache", {
        season: args.season,
        data: args.data,
        cachedAt: Date.now(),
      });
    }
  },
});

export const getStandings = action({
  args: { season: v.optional(v.number()) },
  handler: async (
    ctx,
    args
  ): Promise<{ standings: NCAABStanding[]; cachedAt: number }> => {
    const season = args.season ?? new Date().getFullYear();

    const cached = await ctx.runQuery(internal.ncaab._getStandingsCache, { season });
    if (cached && isCacheValid(cached.cachedAt, STANDINGS_TTL)) {
      const cachedStandings = cached.data as NCAABStanding[];
      if (cachedStandings.length > 0) {
        return { standings: cachedStandings, cachedAt: cached.cachedAt };
      }
    }

    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) throw new Error("BALLDONTLIE_API_KEY not configured");

    const client = createNCAABClient(apiKey);
    const conferences = await client.getConferences();

    const allStandings = await Promise.all(
      conferences.map((conf) => client.getStandings(conf.id, season))
    );
    let standings = allStandings.flat();

    // Fall back to previous year if current year returns empty
    if (standings.length === 0 && !args.season) {
      const fallbackSeason = season - 1;
      const fallbackCached = await ctx.runQuery(internal.ncaab._getStandingsCache, { season: fallbackSeason });
      if (fallbackCached && isCacheValid(fallbackCached.cachedAt, STANDINGS_TTL)) {
        const fb = fallbackCached.data as NCAABStanding[];
        if (fb.length > 0) return { standings: fb, cachedAt: fallbackCached.cachedAt };
      }
      const fallbackAll = await Promise.all(
        conferences.map((conf) => client.getStandings(conf.id, fallbackSeason))
      );
      standings = fallbackAll.flat();
      if (standings.length > 0) {
        await ctx.runMutation(internal.ncaab._upsertStandingsCache, {
          season: fallbackSeason,
          data: standings,
        });
        return { standings, cachedAt: Date.now() };
      }
    }

    await ctx.runMutation(internal.ncaab._upsertStandingsCache, {
      season,
      data: standings,
    });

    return { standings, cachedAt: Date.now() };
  },
});

// ========================================
// Rankings
// ========================================

export const _getRankingsCache = internalQuery({
  args: { season: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ncaabRankingsCache")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .first();
  },
});

export const _upsertRankingsCache = internalMutation({
  args: { season: v.number(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ncaabRankingsCache")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data, cachedAt: Date.now() });
    } else {
      await ctx.db.insert("ncaabRankingsCache", {
        season: args.season,
        data: args.data,
        cachedAt: Date.now(),
      });
    }
  },
});

export const getRankings = action({
  args: { season: v.optional(v.number()) },
  handler: async (
    ctx,
    args
  ): Promise<{ rankings: NCAABRanking[]; cachedAt: number }> => {
    const season = args.season ?? new Date().getFullYear();

    const cached = await ctx.runQuery(internal.ncaab._getRankingsCache, { season });
    if (cached && isCacheValid(cached.cachedAt, RANKINGS_TTL)) {
      const cachedRankings = cached.data as NCAABRanking[];
      if (cachedRankings.length > 0) {
        return { rankings: cachedRankings, cachedAt: cached.cachedAt };
      }
    }

    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) throw new Error("BALLDONTLIE_API_KEY not configured");

    const client = createNCAABClient(apiKey);
    let rankings = await client.getRankings(season);

    // Fall back to previous year if current year returns empty
    if (rankings.length === 0 && !args.season) {
      const fallbackSeason = season - 1;
      const fallbackCached = await ctx.runQuery(internal.ncaab._getRankingsCache, { season: fallbackSeason });
      if (fallbackCached && isCacheValid(fallbackCached.cachedAt, RANKINGS_TTL)) {
        const fb = fallbackCached.data as NCAABRanking[];
        if (fb.length > 0) return { rankings: fb, cachedAt: fallbackCached.cachedAt };
      }
      rankings = await client.getRankings(fallbackSeason);
      if (rankings.length > 0) {
        await ctx.runMutation(internal.ncaab._upsertRankingsCache, {
          season: fallbackSeason,
          data: rankings,
        });
        return { rankings, cachedAt: Date.now() };
      }
    }

    await ctx.runMutation(internal.ncaab._upsertRankingsCache, {
      season,
      data: rankings,
    });

    return { rankings, cachedAt: Date.now() };
  },
});

// ========================================
// Team Season Stats
// ========================================

export const searchPlayers = action({
  args: { query: v.string() },
  handler: async (_ctx, args) => {
    const normalizeName = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    const trimmed = args.query.trim();
    if (!trimmed) return [];

    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) throw new Error("BALLDONTLIE_API_KEY not configured");

    const url = `https://api.balldontlie.io/ncaab/v1/players?search=${encodeURIComponent(trimmed)}&per_page=10`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    });

    if (!res.ok) {
      console.error("NCAAB player search failed:", res.status);
      return [];
    }

    const json = await res.json();
    const bdlPlayers = (json.data ?? []).map((p: any) => ({
      id: String(p.id),
      name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
      sport: "NCAAM",
      team: p.team?.full_name ?? p.team?.name ?? "N/A",
      position: p.position ?? "N/A",
      number: p.jersey_number ? String(p.jersey_number) : "0",
      photoUrl: undefined as string | undefined,
    }));

    // Try to fetch headshots from ESPN search API
    try {
      const espnUrl = `https://site.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(trimmed)}&limit=20&type=player`;
      const espnRes = await fetch(espnUrl);
      if (espnRes.ok) {
        const espnJson = await espnRes.json();
        const espnItems: any[] = espnJson?.items ?? [];

        // Build a map of normalized name → headshot URL (prefer college basketball results)
        const headshotMap = new Map<string, string>();
        for (const item of espnItems) {
          const name = normalizeName(item.displayName ?? "");
          const headshot = item.headshot?.href;
          if (!name || !headshot) continue;
          const league = item.league ?? item.sport?.slug ?? item.sport?.name ?? "";
          // Prefer mens-college-basketball, but accept nba too (for recently drafted players)
          if (
            league === "mens-college-basketball" ||
            league === "college basketball" ||
            !headshotMap.has(name)
          ) {
            headshotMap.set(name, headshot);
          }
        }

        // Match BDL players to ESPN headshots by name
        for (const p of bdlPlayers) {
          const match = headshotMap.get(normalizeName(p.name));
          if (match) {
            p.photoUrl = match;
          }
        }
      }
    } catch {
      // ESPN search failed — continue without photos
    }

    return bdlPlayers;
  },
});

// ========================================
// Team Season Stats
// ========================================

export const getPlayerStats = action({
  args: {
    playerId: v.number(),
    season: v.optional(v.number()),
  },
  handler: async (
    _ctx,
    args
  ): Promise<{ stats: NCAABPlayerSeasonStats | null }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) throw new Error("BALLDONTLIE_API_KEY not configured");

    const client = createNCAABClient(apiKey);
    const stats = await client.getPlayerSeasonStats(args.playerId, args.season);

    return { stats };
  },
});

export const getTeamSeasonStats = action({
  args: {
    teamIds: v.array(v.number()),
    season: v.optional(v.number()),
  },
  handler: async (
    _ctx,
    args
  ): Promise<{ stats: NCAABTeamSeasonStats[]; cachedAt: number }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) throw new Error("BALLDONTLIE_API_KEY not configured");

    const client = createNCAABClient(apiKey);
    const stats = await client.getTeamSeasonStats(args.teamIds, args.season);

    return { stats, cachedAt: Date.now() };
  },
});
