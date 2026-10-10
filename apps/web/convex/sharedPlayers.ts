import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate short, URL-friendly share ID
function generateShareId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create a shared player (called from mobile/web app)
export const createSharedPlayer = mutation({
  args: {
    playerId: v.string(),
    name: v.string(),
    sport: v.string(),
    team: v.string(),
    position: v.string(),
    number: v.string(),
    photoUrl: v.optional(v.string()),
    sportsReferenceUrl: v.optional(v.string()),
    stats: v.optional(v.any()),
    hallOfFame: v.optional(v.boolean()),
    links: v.array(
      v.object({
        id: v.string(),
        url: v.string(),
        title: v.string(),
        order: v.number(),
      })
    ),
    sharedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shareId = generateShareId();

    await ctx.db.insert("sharedPlayers", {
      shareId,
      playerId: args.playerId,
      name: args.name,
      sport: args.sport,
      team: args.team,
      position: args.position,
      number: args.number,
      photoUrl: args.photoUrl,
      sportsReferenceUrl: args.sportsReferenceUrl,
      stats: args.stats,
      hallOfFame: args.hallOfFame,
      links: args.links,
      sharedByName: args.sharedByName,
      sharedAt: Date.now(),
      isPublic: true,
      viewCount: 0,
    });

    return { shareId };
  },
});

// Get a shared player by shareId (called from web app)
export const getSharedPlayer = query({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("sharedPlayers")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    return player;
  },
});

// Increment view count when someone views a shared player
export const incrementViewCount = mutation({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("sharedPlayers")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    if (player) {
      await ctx.db.patch(player._id, {
        viewCount: player.viewCount + 1,
      });
    }
  },
});

// Get recent shared players (for a potential "discover" feature)
export const getRecentSharedPlayers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("sharedPlayers")
      .withIndex("by_shared_at")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(limit);
  },
});

// Delete a shared player
export const deleteSharedPlayer = mutation({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db
      .query("sharedPlayers")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    if (!player) {
      throw new Error("Player not found");
    }

    await ctx.db.delete(player._id);
  },
});
