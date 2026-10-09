import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createBallDontLieClient, type BDLPlayer } from "./lib/balldontlie";
import {
  EAST_TEAM_IDS,
  PREDICTION_CATEGORY_MAP,
  PREDICTIONS_SEASON,
  WEST_TEAM_IDS,
} from "./lib/predictions";

const pickValidator = v.object({
  category: v.string(),
  slot: v.number(),
  id: v.number(),
  name: v.string(),
  teamAbbr: v.optional(v.string()),
});

type Pick = {
  category: string;
  slot: number;
  id: number;
  name: string;
  teamAbbr?: string;
};

function generateShareId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function validatePicks(picks: Pick[]) {
  const seenSlots = new Set<string>();
  const seenInGroup = new Set<string>();

  for (const pick of picks) {
    const category = PREDICTION_CATEGORY_MAP[pick.category];
    if (!category) {
      throw new Error(`Unknown category: ${pick.category}`);
    }
    if (!Number.isInteger(pick.slot) || pick.slot < 0 || pick.slot >= category.slots) {
      throw new Error(`Invalid slot for ${category.label}`);
    }
    if (pick.name.length > 100 || (pick.teamAbbr && pick.teamAbbr.length > 5)) {
      throw new Error("Invalid pick");
    }

    const slotKey = `${pick.category}:${pick.slot}`;
    if (seenSlots.has(slotKey)) {
      throw new Error(`Duplicate slot in ${category.label}`);
    }
    seenSlots.add(slotKey);

    const groupKey = `${category.exclusiveGroup ?? category.key}:${pick.id}`;
    if (seenInGroup.has(groupKey)) {
      throw new Error(`${pick.name} is picked more than once in ${category.label}`);
    }
    seenInGroup.add(groupKey);
  }
}

function validateSeeding(seeding: number[], teamIds: number[], conference: string) {
  const isPermutation =
    seeding.length === teamIds.length &&
    new Set(seeding).size === teamIds.length &&
    seeding.every((id) => teamIds.includes(id));
  if (!isPermutation) {
    throw new Error(`${conference} seeding must rank every ${conference} team exactly once`);
  }
}

/**
 * Get the signed-in user's predictions for the open season
 */
export const getMyPredictions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("seasonPredictions")
      .withIndex("by_user_season", (q) =>
        q.eq("userId", identity.subject).eq("season", PREDICTIONS_SEASON)
      )
      .first();
  },
});

/**
 * Create or update the signed-in user's predictions for the open season
 */
export const savePredictions = mutation({
  args: {
    picks: v.array(pickValidator),
    eastSeeding: v.array(v.number()),
    westSeeding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    validatePicks(args.picks);
    validateSeeding(args.eastSeeding, EAST_TEAM_IDS, "East");
    validateSeeding(args.westSeeding, WEST_TEAM_IDS, "West");

    const season = PREDICTIONS_SEASON;
    const now = Date.now();

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    const displayName = user?.username ?? user?.name ?? identity.name ?? undefined;

    const existing = await ctx.db
      .query("seasonPredictions")
      .withIndex("by_user_season", (q) =>
        q.eq("userId", identity.subject).eq("season", season)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        picks: args.picks,
        eastSeeding: args.eastSeeding,
        westSeeding: args.westSeeding,
        displayName,
        updatedAt: now,
      });
      return { shareId: existing.shareId };
    }

    let shareId = generateShareId();
    while (
      await ctx.db
        .query("seasonPredictions")
        .withIndex("by_share_id", (q) => q.eq("shareId", shareId))
        .first()
    ) {
      shareId = generateShareId();
    }

    await ctx.db.insert("seasonPredictions", {
      userId: identity.subject,
      season,
      shareId,
      displayName,
      picks: args.picks,
      eastSeeding: args.eastSeeding,
      westSeeding: args.westSeeding,
      createdAt: now,
      updatedAt: now,
    });

    return { shareId };
  },
});

/**
 * Public read-only view of a user's predictions
 */
export const getPredictionsByShareId = query({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const predictions = await ctx.db
      .query("seasonPredictions")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    if (!predictions) {
      return null;
    }

    return {
      shareId: predictions.shareId,
      season: predictions.season,
      displayName: predictions.displayName,
      picks: predictions.picks,
      eastSeeding: predictions.eastSeeding,
      westSeeding: predictions.westSeeding,
      updatedAt: predictions.updatedAt,
    };
  },
});

/**
 * Search players on current NBA rosters for prediction picks
 */
export const searchPredictionPlayers = action({
  args: { query: v.string() },
  handler: async (
    _ctx,
    args
  ): Promise<
    Array<{
      id: number;
      name: string;
      position: string;
      teamAbbr: string | null;
      draftYear: number | null;
    }>
  > => {
    const search = args.query.trim();
    if (search.length < 2) {
      return [];
    }

    const apiKey = process.env.BALLDONTLIE_API_KEY;
    if (!apiKey) {
      throw new Error("BALLDONTLIE_API_KEY not configured");
    }

    const client = createBallDontLieClient(apiKey);

    // BDL matches a single name, so search the last word of multi-word queries
    const words = search.split(/\s+/);
    const searchTerm = words[words.length - 1];

    let players: BDLPlayer[];
    try {
      players = (await client.searchActivePlayers(searchTerm, 25)).data;
    } catch (error) {
      // The active players endpoint requires a paid tier; fall back to all players
      if (!(error instanceof Error && error.message === "PAYWALL_FEATURE")) {
        throw error;
      }
      players = (await client.searchPlayers(searchTerm, 25)).data;
    }

    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
    const queryWords = normalize(search).split(/\s+/);

    return players
      .filter((p) => {
        const fullName = normalize(`${p.first_name} ${p.last_name}`);
        return queryWords.every((word) => fullName.includes(word));
      })
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        position: p.position,
        teamAbbr: p.team?.abbreviation ?? null,
        draftYear: p.draft_year,
      }));
  },
});
