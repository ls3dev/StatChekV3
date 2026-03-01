import { query, action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  createBallDontLieClient,
  CACHE_TTL,
  isCacheValid,
  getCurrentNBASeason,
  formatDateForAPI,
  type BDLStanding,
  type BDLGame,
  type BDLSeasonAverages,
  type BDLAdvancedStats,
  type BDLContract,
  type BDLInjury,
  type BDLLeader,
  type BDLBoxScore,
  type BDLPlayerBoxScore,
} from "./lib/balldontlie";

// ========================================
// Internal Queries (for cache lookups)
// ========================================

export const _getStandingsCache = internalQuery({
  args: { season: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nbaStandingsCache")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .first();
  },
});

export const _getGamesCache = internalQuery({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nbaGamesCache")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
  },
});

export const _getPlayerStatsCache = internalQuery({
  args: { playerId: v.number(), season: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nbaPlayerStatsCache")
      .withIndex("by_player_season", (q) =>
        q.eq("playerId", args.playerId).eq("season", args.season)
      )
      .first();
  },
});

export const _getContractsCache = internalQuery({
  args: {
    entityType: v.union(v.literal("player"), v.literal("team")),
    entityId: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nbaContractsCache")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .first();
  },
});

export const _getInjuriesCache = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get the most recent injuries cache entry
    const entries = await ctx.db.query("nbaInjuriesCache").collect();
    return entries[0] ?? null;
  },
});

export const _getLeadersCache = internalQuery({
  args: { season: v.number(), statType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nbaLeadersCache")
      .withIndex("by_season_stat", (q) =>
        q.eq("season", args.season).eq("statType", args.statType)
      )
      .first();
  },
});

export const _getDraftPicks = internalQuery({
  args: { teamId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nbaDraftPicks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();
  },
});

// ========================================
// Internal Mutations (for cache updates)
// ========================================

export const _upsertStandingsCache = internalMutation({
  args: { season: v.number(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nbaStandingsCache")
      .withIndex("by_season", (q) => q.eq("season", args.season))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        cachedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("nbaStandingsCache", {
        season: args.season,
        data: args.data,
        cachedAt: Date.now(),
      });
    }
  },
});

export const _upsertGamesCache = internalMutation({
  args: { date: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nbaGamesCache")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        cachedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("nbaGamesCache", {
        date: args.date,
        data: args.data,
        cachedAt: Date.now(),
      });
    }
  },
});

export const _upsertPlayerStatsCache = internalMutation({
  args: { playerId: v.number(), season: v.number(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nbaPlayerStatsCache")
      .withIndex("by_player_season", (q) =>
        q.eq("playerId", args.playerId).eq("season", args.season)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        cachedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("nbaPlayerStatsCache", {
        playerId: args.playerId,
        season: args.season,
        data: args.data,
        cachedAt: Date.now(),
      });
    }
  },
});

export const _upsertContractsCache = internalMutation({
  args: {
    entityType: v.union(v.literal("player"), v.literal("team")),
    entityId: v.number(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nbaContractsCache")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        cachedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("nbaContractsCache", {
        entityType: args.entityType,
        entityId: args.entityId,
        data: args.data,
        cachedAt: Date.now(),
      });
    }
  },
});

export const _upsertInjuriesCache = internalMutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    // Clear old entries and insert new
    const existing = await ctx.db.query("nbaInjuriesCache").collect();
    for (const entry of existing) {
      await ctx.db.delete(entry._id);
    }
    await ctx.db.insert("nbaInjuriesCache", {
      data: args.data,
      cachedAt: Date.now(),
    });
  },
});

export const _upsertLeadersCache = internalMutation({
  args: { season: v.number(), statType: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nbaLeadersCache")
      .withIndex("by_season_stat", (q) =>
        q.eq("season", args.season).eq("statType", args.statType)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        cachedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("nbaLeadersCache", {
        season: args.season,
        statType: args.statType,
        data: args.data,
        cachedAt: Date.now(),
      });
    }
  },
});

export const _upsertDraftPicks = internalMutation({
  args: {
    teamId: v.number(),
    teamAbbreviation: v.string(),
    picks: v.array(
      v.object({
        year: v.number(),
        round: v.number(),
        originalTeam: v.string(),
        conditions: v.optional(v.string()),
        swapRights: v.optional(v.boolean()),
        viaTradeWith: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nbaDraftPicks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        teamAbbreviation: args.teamAbbreviation,
        picks: args.picks,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("nbaDraftPicks", {
        teamId: args.teamId,
        teamAbbreviation: args.teamAbbreviation,
        picks: args.picks,
        lastUpdated: Date.now(),
      });
    }
  },
});

// ========================================
// Helper: Check Pro Status
// ========================================

export const _checkProStatus = internalQuery({
  args: {},
  handler: async (ctx) => {
    // TODO: Temporarily bypassing pro check - all users are pro
    return { isProUser: true };
  },
});

// ========================================
// FREE Actions (Public API)
// ========================================

/**
 * Get NBA standings (FREE)
 */
export const getStandings = action({
  args: { season: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ standings: BDLStanding[]; cachedAt: number }> => {
    const season = args.season ?? getCurrentNBASeason();

    // Check cache
    const cached = await ctx.runQuery(internal.nba._getStandingsCache, {
      season,
    });

    if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.STANDINGS)) {
      return { standings: cached.data as BDLStanding[], cachedAt: cached.cachedAt };
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const standings = await client.getStandings(season);

    // Update cache
    await ctx.runMutation(internal.nba._upsertStandingsCache, {
      season,
      data: standings,
    });

    return { standings, cachedAt: Date.now() };
  },
});

/**
 * Get games for a date (FREE)
 */
export const getGames = action({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{ games: BDLGame[]; cachedAt: number }> => {
    const date = args.date ?? formatDateForAPI(new Date());

    // Check cache
    const cached = await ctx.runQuery(internal.nba._getGamesCache, { date });

    if (cached) {
      const games = cached.data as BDLGame[];
      // Use short TTL if any games are not final (live or scheduled)
      const hasActiveGames = games.some((g) => g.status !== "Final");
      const ttl = hasActiveGames ? CACHE_TTL.GAMES_LIVE : CACHE_TTL.GAMES_PAST;

      if (isCacheValid(cached.cachedAt, ttl)) {
        return { games, cachedAt: cached.cachedAt };
      }
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const response = await client.getGames({ date });

    // Update cache
    await ctx.runMutation(internal.nba._upsertGamesCache, {
      date,
      data: response.data,
    });

    return { games: response.data, cachedAt: Date.now() };
  },
});

/**
 * Get basic player season averages (FREE)
 */
export const getPlayerStats = action({
  args: { playerId: v.number(), season: v.optional(v.number()) },
  handler: async (
    ctx,
    args
  ): Promise<{ stats: BDLSeasonAverages | null; cachedAt: number }> => {
    const season = args.season ?? getCurrentNBASeason();

    // Check cache
    const cached = await ctx.runQuery(internal.nba._getPlayerStatsCache, {
      playerId: args.playerId,
      season,
    });

    if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.SEASON_AVERAGES)) {
      return {
        stats: cached.data?.basic as BDLSeasonAverages | null,
        cachedAt: cached.cachedAt,
      };
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const stats = await client.getSeasonAverages(args.playerId, season);

    // Update cache (store both basic and advanced together)
    const existingCache = cached?.data ?? {};
    await ctx.runMutation(internal.nba._upsertPlayerStatsCache, {
      playerId: args.playerId,
      season,
      data: { ...existingCache, basic: stats },
    });

    return { stats, cachedAt: Date.now() };
  },
});

/**
 * Get league leaders (FREE)
 */
export const getLeaders = action({
  args: {
    statType: v.optional(v.string()),
    season: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ leaders: BDLLeader[]; cachedAt: number }> => {
    const season = args.season ?? getCurrentNBASeason();
    const statType = args.statType ?? "pts";

    // Check cache
    const cached = await ctx.runQuery(internal.nba._getLeadersCache, {
      season,
      statType,
    });

    if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.LEADERS)) {
      return { leaders: cached.data as BDLLeader[], cachedAt: cached.cachedAt };
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const leaders = await client.getLeaders({ season, stat_type: statType });

    // Update cache
    await ctx.runMutation(internal.nba._upsertLeadersCache, {
      season,
      statType,
      data: leaders,
    });

    return { leaders, cachedAt: Date.now() };
  },
});

// ========================================
// PRO Actions (Paywalled)
// ========================================

/**
 * Get advanced player stats (PRO)
 */
export const getAdvancedStats = action({
  args: { playerId: v.number(), season: v.optional(v.number()) },
  handler: async (
    ctx,
    args
  ): Promise<{
    stats: BDLAdvancedStats | null;
    cachedAt: number;
    requiresPro: boolean;
  }> => {
    // Check pro status
    const { isProUser } = await ctx.runQuery(internal.nba._checkProStatus);
    if (!isProUser) {
      return { stats: null, cachedAt: 0, requiresPro: true };
    }

    const season = args.season ?? getCurrentNBASeason();

    // Check cache
    const cached = await ctx.runQuery(internal.nba._getPlayerStatsCache, {
      playerId: args.playerId,
      season,
    });

    if (
      cached?.data?.advanced &&
      isCacheValid(cached.cachedAt, CACHE_TTL.SEASON_AVERAGES)
    ) {
      return {
        stats: cached.data.advanced as BDLAdvancedStats,
        cachedAt: cached.cachedAt,
        requiresPro: false,
      };
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const stats = await client.getAdvancedStats(args.playerId, season);

    // Update cache
    const existingCache = cached?.data ?? {};
    await ctx.runMutation(internal.nba._upsertPlayerStatsCache, {
      playerId: args.playerId,
      season,
      data: { ...existingCache, advanced: stats },
    });

    return { stats, cachedAt: Date.now(), requiresPro: false };
  },
});

/**
 * Get player contract details (PRO)
 */
export const getPlayerContract = action({
  args: { playerId: v.number() },
  handler: async (
    ctx,
    args
  ): Promise<{
    contracts: BDLContract[];
    cachedAt: number;
    requiresPro: boolean;
  }> => {
    // Check pro status
    const { isProUser } = await ctx.runQuery(internal.nba._checkProStatus);
    if (!isProUser) {
      return { contracts: [], cachedAt: 0, requiresPro: true };
    }

    // Check cache
    const cached = await ctx.runQuery(internal.nba._getContractsCache, {
      entityType: "player",
      entityId: args.playerId,
    });

    if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.CONTRACTS)) {
      return {
        contracts: cached.data as BDLContract[],
        cachedAt: cached.cachedAt,
        requiresPro: false,
      };
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const contracts = await client.getPlayerContracts(args.playerId);

    // Update cache
    await ctx.runMutation(internal.nba._upsertContractsCache, {
      entityType: "player",
      entityId: args.playerId,
      data: contracts,
    });

    return { contracts, cachedAt: Date.now(), requiresPro: false };
  },
});

/**
 * Get team contracts/payroll (PRO)
 */
export const getTeamContracts = action({
  args: { teamId: v.number() },
  handler: async (
    ctx,
    args
  ): Promise<{
    contracts: BDLContract[];
    cachedAt: number;
    requiresPro: boolean;
  }> => {
    // Check pro status
    const { isProUser } = await ctx.runQuery(internal.nba._checkProStatus);
    if (!isProUser) {
      return { contracts: [], cachedAt: 0, requiresPro: true };
    }

    // Check cache
    const cached = await ctx.runQuery(internal.nba._getContractsCache, {
      entityType: "team",
      entityId: args.teamId,
    });

    if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.CONTRACTS)) {
      return {
        contracts: cached.data as BDLContract[],
        cachedAt: cached.cachedAt,
        requiresPro: false,
      };
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const contracts = await client.getTeamContracts(args.teamId);

    // Update cache
    await ctx.runMutation(internal.nba._upsertContractsCache, {
      entityType: "team",
      entityId: args.teamId,
      data: contracts,
    });

    return { contracts, cachedAt: Date.now(), requiresPro: false };
  },
});

/**
 * Get injury reports (PRO)
 */
export const getInjuries = action({
  args: { teamId: v.optional(v.number()) },
  handler: async (
    ctx,
    args
  ): Promise<{
    injuries: BDLInjury[];
    cachedAt: number;
    requiresPro: boolean;
  }> => {
    // Check pro status
    const { isProUser } = await ctx.runQuery(internal.nba._checkProStatus);
    if (!isProUser) {
      return { injuries: [], cachedAt: 0, requiresPro: true };
    }

    // Check cache (we cache all injuries together)
    const cached = await ctx.runQuery(internal.nba._getInjuriesCache, {});

    if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.INJURIES)) {
      let injuries = cached.data as BDLInjury[];
      // Filter by team if specified (check both team.id and player.team_id)
      if (args.teamId) {
        injuries = injuries.filter((i) =>
          i.team?.id === args.teamId || (i.player as any)?.team_id === args.teamId
        );
      }
      return { injuries, cachedAt: cached.cachedAt, requiresPro: false };
    }

    // Fetch from API
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const allInjuries = await client.getInjuries();

    // Update cache with all injuries
    await ctx.runMutation(internal.nba._upsertInjuriesCache, {
      data: allInjuries,
    });

    // Return filtered if team specified (check both team.id and player.team_id)
    const injuries = args.teamId
      ? allInjuries.filter((i) =>
          i.team?.id === args.teamId || (i.player as any)?.team_id === args.teamId
        )
      : allInjuries;

    return { injuries, cachedAt: Date.now(), requiresPro: false };
  },
});

// ========================================
// Utility Queries
// ========================================

/**
 * Get current NBA season
 */
export const getCurrentSeason = query({
  args: {},
  handler: async () => {
    return getCurrentNBASeason();
  },
});

/**
 * Search for a player by name and return their Ball Don't Lie ID
 */
export const searchPlayerByName = action({
  args: { name: v.string() },
  handler: async (
    _ctx,
    args
  ): Promise<{
    playerId: number | null;
    player: {
      id: number;
      first_name: string;
      last_name: string;
      position: string;
      team: { id: number; full_name: string; abbreviation: string };
    } | null;
  }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);

    // BDL API works better with last name for unique matches
    const nameParts = args.name.trim().split(/\s+/);
    const searchTerm = nameParts.length > 1 ? nameParts[nameParts.length - 1] : args.name;

    const results = await client.searchPlayers(searchTerm, 10);

    // Find best match - prefer exact name match
    const normalizedInput = args.name.toLowerCase().trim();
    let player = results.data.find((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      return fullName === normalizedInput;
    });

    // Fallback to first result if no exact match
    if (!player && results.data.length > 0) {
      player = results.data[0];
    }

    return {
      playerId: player?.id ?? null,
      player: player
        ? {
            id: player.id,
            first_name: player.first_name,
            last_name: player.last_name,
            position: player.position,
            team: {
              id: player.team.id,
              full_name: player.team.full_name,
              abbreviation: player.team.abbreviation,
            },
          }
        : null,
    };
  },
});

/**
 * Check if user has pro access (for UI)
 */
export const checkProAccess = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isProUser: false, isAuthenticated: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { isProUser: false, isAuthenticated: true };
    }

    const isProUser =
      user.isProUser === true &&
      (!user.proExpiresAt || user.proExpiresAt > Date.now());

    return { isProUser, isAuthenticated: true };
  },
});

// ========================================
// Draft Picks
// ========================================

interface DraftPick {
  year: number;
  round: number;
  originalTeam: string;
  conditions?: string;
  swapRights?: boolean;
  viaTradeWith?: string;
}

/**
 * Get team draft picks (FREE)
 * Data is static and manually updated after trades/drafts
 */
export const getTeamFuturePicks = query({
  args: { teamId: v.number() },
  handler: async (ctx, args): Promise<{ picks: DraftPick[]; lastUpdated: number | null }> => {
    const data = await ctx.db
      .query("nbaDraftPicks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (!data) {
      return { picks: [], lastUpdated: null };
    }

    return { picks: data.picks as DraftPick[], lastUpdated: data.lastUpdated };
  },
});

/**
 * Bulk update draft picks (for seed script)
 * This is an internal mutation called by the seed script
 */
export const updateDraftPicks = internalMutation({
  args: {
    teamId: v.number(),
    teamAbbreviation: v.string(),
    picks: v.array(
      v.object({
        year: v.number(),
        round: v.number(),
        originalTeam: v.string(),
        conditions: v.optional(v.string()),
        swapRights: v.optional(v.boolean()),
        viaTradeWith: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("nbaDraftPicks")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        teamAbbreviation: args.teamAbbreviation,
        picks: args.picks,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("nbaDraftPicks", {
        teamId: args.teamId,
        teamAbbreviation: args.teamAbbreviation,
        picks: args.picks,
        lastUpdated: Date.now(),
      });
    }
  },
});

// ========================================
// Box Score Actions
// ========================================

/**
 * Get box score for a specific game
 * Returns player stats for both teams
 */
export const getBoxScore = action({
  args: {
    date: v.string(),
    homeTeamId: v.number(),
    visitorTeamId: v.number(),
  },
  handler: async (
    _ctx,
    args
  ): Promise<{
    boxScore: BDLBoxScore | null;
    isLive: boolean;
  }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);

    // First try to get live box scores (for in-progress games)
    const liveBoxScores = await client.getLiveBoxScores();
    const liveGame = liveBoxScores.find(
      (game) =>
        (game.home_team.id === args.homeTeamId && game.visitor_team.id === args.visitorTeamId) ||
        (game.home_team.id === args.visitorTeamId && game.visitor_team.id === args.homeTeamId)
    );

    if (liveGame) {
      return { boxScore: liveGame, isLive: true };
    }

    // Fetch historical box scores for the date
    const boxScores = await client.getBoxScores(args.date);
    const matchingGame = boxScores.find(
      (game) =>
        (game.home_team.id === args.homeTeamId && game.visitor_team.id === args.visitorTeamId) ||
        (game.home_team.id === args.visitorTeamId && game.visitor_team.id === args.homeTeamId)
    );

    return { boxScore: matchingGame ?? null, isLive: false };
  },
});

// ========================================
// Box Score Testing
// ========================================

/**
 * Test action to fetch box score data for a specific date
 * Usage: npx convex run nba:testBoxScore '{"date": "2025-02-27"}'
 */
export const testBoxScore = action({
  args: { date: v.string() },
  handler: async (_ctx, args): Promise<{
    totalGames: number;
    hornetsGame: {
      opponent: string;
      hornetsScore: number;
      opponentScore: number;
      isHome: boolean;
      players: Array<{
        name: string;
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
        turnover: number;
        plus_minus: number | null;
      }>;
    } | null;
    allMatchups: string[];
  }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const boxScores = await client.getBoxScores(args.date);

    // Get all matchups for the date
    const allMatchups = boxScores.map(
      (game) => `${game.visitor_team.abbreviation} @ ${game.home_team.abbreviation}`
    );

    // Find Hornets game (could be home or visitor)
    const hornetsGameData = boxScores.find(
      (game) =>
        game.home_team.abbreviation === "CHA" ||
        game.visitor_team.abbreviation === "CHA"
    );

    let hornetsGame = null;
    if (hornetsGameData) {
      const isHome = hornetsGameData.home_team.abbreviation === "CHA";
      const hornetsTeam = isHome ? hornetsGameData.home_team : hornetsGameData.visitor_team;
      const opponentTeam = isHome ? hornetsGameData.visitor_team : hornetsGameData.home_team;

      hornetsGame = {
        opponent: opponentTeam.full_name,
        hornetsScore: isHome ? hornetsGameData.home_team_score : hornetsGameData.visitor_team_score,
        opponentScore: isHome ? hornetsGameData.visitor_team_score : hornetsGameData.home_team_score,
        isHome,
        players: hornetsTeam.players.map((p) => ({
          name: `${p.player.first_name} ${p.player.last_name}`,
          min: p.min,
          pts: p.pts,
          reb: p.reb,
          ast: p.ast,
          stl: p.stl,
          blk: p.blk,
          fgm: p.fgm,
          fga: p.fga,
          fg_pct: p.fg_pct,
          fg3m: p.fg3m,
          fg3a: p.fg3a,
          fg3_pct: p.fg3_pct,
          ftm: p.ftm,
          fta: p.fta,
          ft_pct: p.ft_pct,
          turnover: p.turnover,
          plus_minus: p.plus_minus,
        })),
      };
    }

    return {
      totalGames: boxScores.length,
      hornetsGame,
      allMatchups,
    };
  },
});

/**
 * Test action to fetch LIVE box scores for games in progress
 * Usage: npx convex run nba:testLiveBoxScores
 */
export const testLiveBoxScores = action({
  args: {},
  handler: async (_ctx): Promise<{
    liveGames: number;
    games: Array<{
      matchup: string;
      score: string;
      status: string;
    }>;
    rawData: unknown;
  }> => {
    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);
    const liveBoxScores = await client.getLiveBoxScores();

    const games = liveBoxScores.map((game) => ({
      matchup: `${game.visitor_team.abbreviation} @ ${game.home_team.abbreviation}`,
      score: `${game.visitor_team_score} - ${game.home_team_score}`,
      status: game.datetime || "Live",
    }));

    return {
      liveGames: liveBoxScores.length,
      games,
      rawData: liveBoxScores[0] ?? null,
    };
  },
});
