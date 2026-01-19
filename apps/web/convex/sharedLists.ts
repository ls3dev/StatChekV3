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

// Create a shared list (called from mobile app)
export const createSharedList = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    players: v.array(
      v.object({
        playerId: v.string(),
        order: v.number(),
        name: v.string(),
        team: v.string(),
        position: v.string(),
        photoUrl: v.optional(v.string()),
        sportsReferenceUrl: v.optional(v.string()),
        hallOfFame: v.optional(v.boolean()),
      })
    ),
    links: v.array(
      v.object({
        id: v.string(),
        url: v.string(),
        title: v.string(),
        order: v.number(),
      })
    ),
    originalCreatedAt: v.number(),
    originalUpdatedAt: v.number(),
    sharedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const shareId = generateShareId();

    await ctx.db.insert("sharedLists", {
      shareId,
      name: args.name,
      description: args.description,
      players: args.players,
      links: args.links,
      sharedBy: undefined,
      sharedByName: args.sharedByName,
      originalCreatedAt: args.originalCreatedAt,
      originalUpdatedAt: args.originalUpdatedAt,
      sharedAt: Date.now(),
      isPublic: true,
      viewCount: 0,
    });

    return { shareId };
  },
});

// Get a shared list by shareId (called from web app)
export const getSharedList = query({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("sharedLists")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    return list;
  },
});

// Increment view count when someone views a shared list
export const incrementViewCount = mutation({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("sharedLists")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    if (list) {
      await ctx.db.patch(list._id, {
        viewCount: list.viewCount + 1,
      });
    }
  },
});

// Get recent shared lists (for a potential "discover" feature)
export const getRecentSharedLists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    return await ctx.db
      .query("sharedLists")
      .withIndex("by_shared_at")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(limit);
  },
});

// Delete a shared list
export const deleteSharedList = mutation({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("sharedLists")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    if (!list) {
      throw new Error("List not found");
    }

    await ctx.db.delete(list._id);
  },
});
