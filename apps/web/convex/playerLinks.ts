import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const FREE_LINK_LIMIT = 3;

/**
 * Get all links for a specific player
 */
export const getPlayerLinks = query({
  args: {
    userId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("playerLinks")
      .withIndex("by_user_player", (q) =>
        q.eq("userId", args.userId).eq("playerId", args.playerId)
      )
      .collect();

    // Sort by order
    return links.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get all links for a user (across all players)
 */
export const getAllUserPlayerLinks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("playerLinks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

/**
 * Add a link to a player
 */
export const addPlayerLink = mutation({
  args: {
    userId: v.string(),
    playerId: v.string(),
    url: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Check current link count for this player
    const existingLinks = await ctx.db
      .query("playerLinks")
      .withIndex("by_user_player", (q) =>
        q.eq("userId", args.userId).eq("playerId", args.playerId)
      )
      .collect();

    if (existingLinks.length >= FREE_LINK_LIMIT) {
      return { success: false, reason: "limit_reached" };
    }

    // Add the link
    const linkId = await ctx.db.insert("playerLinks", {
      userId: args.userId,
      playerId: args.playerId,
      url: args.url,
      title: args.title,
      order: existingLinks.length,
      createdAt: Date.now(),
    });

    return { success: true, linkId };
  },
});

/**
 * Update a player link
 */
export const updatePlayerLink = mutation({
  args: {
    linkId: v.id("playerLinks"),
    updates: v.object({
      url: v.optional(v.string()),
      title: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, args.updates);
  },
});

/**
 * Delete a player link
 */
export const deletePlayerLink = mutation({
  args: { linkId: v.id("playerLinks") },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) {
      throw new Error("Link not found");
    }

    // Delete the link
    await ctx.db.delete(args.linkId);

    // Reorder remaining links for this player
    const remainingLinks = await ctx.db
      .query("playerLinks")
      .withIndex("by_user_player", (q) =>
        q.eq("userId", link.userId).eq("playerId", link.playerId)
      )
      .collect();

    // Update order
    const sorted = remainingLinks.sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await ctx.db.patch(sorted[i]._id, { order: i });
      }
    }
  },
});

/**
 * Reorder player links
 */
export const reorderPlayerLinks = mutation({
  args: {
    userId: v.string(),
    playerId: v.string(),
    newOrder: v.array(v.id("playerLinks")),
  },
  handler: async (ctx, args) => {
    // Update order for each link
    for (let i = 0; i < args.newOrder.length; i++) {
      await ctx.db.patch(args.newOrder[i], { order: i });
    }
  },
});

/**
 * Get link count for a player (for UI limit display)
 */
export const getPlayerLinkCount = query({
  args: {
    userId: v.string(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("playerLinks")
      .withIndex("by_user_player", (q) =>
        q.eq("userId", args.userId).eq("playerId", args.playerId)
      )
      .collect();

    return {
      count: links.length,
      limit: FREE_LINK_LIMIT,
      isAtLimit: links.length >= FREE_LINK_LIMIT,
    };
  },
});
