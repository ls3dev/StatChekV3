import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const listTypeValidator = v.union(
  v.literal("ranking"),
  v.literal("agenda"),
  v.literal("vs")
);

function inferLegacyListType(playerCount: number): "ranking" | "agenda" | "vs" {
  if (playerCount <= 1) return "agenda";
  if (playerCount === 2) return "vs";
  return "ranking";
}

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
    listType: listTypeValidator,
    players: v.array(
      v.object({
        playerId: v.string(),
        sport: v.optional(v.string()),
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
      listType: args.listType,
      players: args.players,
      links: args.links,
      sharedBy: undefined,
      sharedByName: args.sharedByName,
      originalCreatedAt: args.originalCreatedAt,
      originalUpdatedAt: args.originalUpdatedAt,
      sharedAt: Date.now(),
      isPublic: true,
      viewCount: 0,
      upvoteCount: 0,
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

    if (!list) return null;

    return {
      ...list,
      listType: list.listType ?? inferLegacyListType(list.players.length),
      upvoteCount: list.upvoteCount ?? 0,
    };
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

export const getSharedListVoteState = query({
  args: {
    shareId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("sharedLists")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    if (!list) {
      return null;
    }

    let hasUpvoted = false;
    if (args.userId) {
      const vote = await ctx.db
        .query("sharedListVotes")
        .withIndex("by_share_user", (q) =>
          q.eq("shareId", args.shareId).eq("userId", args.userId!)
        )
        .first();
      hasUpvoted = !!vote;
    }

    return {
      upvoteCount: list.upvoteCount ?? 0,
      hasUpvoted,
    };
  },
});

export const upvoteSharedList = mutation({
  args: {
    shareId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("sharedLists")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    if (!list) {
      throw new Error("List not found");
    }

    const existingVote = await ctx.db
      .query("sharedListVotes")
      .withIndex("by_share_user", (q) =>
        q.eq("shareId", args.shareId).eq("userId", args.userId)
      )
      .first();

    if (existingVote) {
      return { success: true, alreadyUpvoted: true };
    }

    await ctx.db.insert("sharedListVotes", {
      shareId: args.shareId,
      userId: args.userId,
      createdAt: Date.now(),
    });

    await ctx.db.patch(list._id, {
      upvoteCount: (list.upvoteCount ?? 0) + 1,
    });

    return { success: true, alreadyUpvoted: false };
  },
});

export const cloneSharedList = mutation({
  args: {
    shareId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("sharedLists")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();

    if (!list) {
      throw new Error("Shared list not found");
    }

    const now = Date.now();

    const clonedListId = await ctx.db.insert("userLists", {
      userId: args.userId,
      name: `${list.name} (Clone)`,
      description: list.description,
      listType: list.listType ?? inferLegacyListType(list.players.length),
      players: list.players
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((player, index) => ({
          playerId: player.playerId,
          sport: player.sport,
          order: index,
          addedAt: now,
        })),
      links: list.links
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((link, index) => ({
          id: `${Date.now().toString(36)}_${index}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,
          url: link.url,
          title: link.title,
          order: index,
        })),
      createdAt: now,
      updatedAt: now,
    });

    return { listId: clonedListId };
  },
});

// Get recent shared lists (for a potential "discover" feature)
export const getRecentSharedLists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const lists = await ctx.db
      .query("sharedLists")
      .withIndex("by_shared_at")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .order("desc")
      .take(limit);

    return lists.map((list) => ({
      ...list,
      listType: list.listType ?? inferLegacyListType(list.players.length),
      upvoteCount: list.upvoteCount ?? 0,
    }));
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
