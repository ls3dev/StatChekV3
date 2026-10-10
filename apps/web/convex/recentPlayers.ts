import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const MAX_RECENT_PLAYERS = 10;

/**
 * Get recent players for a user (sorted by last viewed, most recent first)
 */
export const getRecentPlayers = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? MAX_RECENT_PLAYERS;

    return await ctx.db
      .query("recentPlayers")
      .withIndex("by_user_viewed", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Add or update a player in recent history
 * If player exists, updates lastViewedAt and increments viewCount
 * If new, adds to recent with denormalized player data
 */
export const addRecentPlayer = mutation({
  args: {
    userId: v.string(),
    player: v.object({
      id: v.string(),
      name: v.string(),
      sport: v.string(),
      team: v.string(),
      position: v.string(),
      number: v.string(),
      photoUrl: v.optional(v.string()),
      sportsReferenceUrl: v.optional(v.string()),
      stats: v.optional(v.any()),
      hallOfFame: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    // Check if player already in recent history
    const existing = await ctx.db
      .query("recentPlayers")
      .withIndex("by_user_player", (q) =>
        q.eq("userId", args.userId).eq("playerId", args.player.id)
      )
      .first();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        lastViewedAt: Date.now(),
        viewCount: existing.viewCount + 1,
        // Update player data in case it changed
        name: args.player.name,
        team: args.player.team,
        position: args.player.position,
        number: args.player.number,
        photoUrl: args.player.photoUrl,
        sportsReferenceUrl: args.player.sportsReferenceUrl,
        stats: args.player.stats,
        hallOfFame: args.player.hallOfFame,
      });
    } else {
      // Insert new recent player
      await ctx.db.insert("recentPlayers", {
        userId: args.userId,
        playerId: args.player.id,
        name: args.player.name,
        sport: args.player.sport,
        team: args.player.team,
        position: args.player.position,
        number: args.player.number,
        photoUrl: args.player.photoUrl,
        sportsReferenceUrl: args.player.sportsReferenceUrl,
        stats: args.player.stats,
        hallOfFame: args.player.hallOfFame,
        lastViewedAt: Date.now(),
        viewCount: 1,
      });
    }

    // Cleanup: Remove entries beyond the limit
    const allRecent = await ctx.db
      .query("recentPlayers")
      .withIndex("by_user_viewed", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    if (allRecent.length > MAX_RECENT_PLAYERS) {
      // Delete the oldest entries
      const toDelete = allRecent.slice(MAX_RECENT_PLAYERS);
      for (const entry of toDelete) {
        await ctx.db.delete(entry._id);
      }
    }
  },
});

/**
 * Clear all recent players for a user
 */
export const clearRecentPlayers = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const recentPlayers = await ctx.db
      .query("recentPlayers")
      .withIndex("by_user_viewed", (q) => q.eq("userId", args.userId))
      .collect();

    for (const player of recentPlayers) {
      await ctx.db.delete(player._id);
    }
  },
});

/**
 * Get a specific recent player entry (for checking if exists)
 */
export const getRecentPlayer = query({
  args: {
    userId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recentPlayers")
      .withIndex("by_user_player", (q) =>
        q.eq("userId", args.userId).eq("playerId", args.playerId)
      )
      .first();
  },
});
