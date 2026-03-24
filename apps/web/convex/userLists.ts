import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const listTypeValidator = v.union(
  v.literal("ranking"),
  v.literal("agenda"),
  v.literal("vs")
);

type ListType = "ranking" | "agenda" | "vs";

function inferLegacyListType(playerCount: number): ListType {
  if (playerCount <= 1) return "agenda";
  if (playerCount === 2) return "vs";
  return "ranking";
}

function resolveListType(list: { listType?: ListType; players: { playerId: string }[] }): ListType {
  return list.listType ?? inferLegacyListType(list.players.length);
}

function getMaxPlayersForListType(listType: ListType): number {
  switch (listType) {
    case "agenda":
      return 1;
    case "vs":
      return 2;
    case "ranking":
    default:
      return Number.POSITIVE_INFINITY;
  }
}

/**
 * Get all lists for a user (excluding soft-deleted)
 */
export const getUserLists = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userLists")
      .withIndex("by_user_updated", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("deletedAt"), undefined))
      .order("desc")
      .collect();
  },
});

/**
 * Get a single list by ID
 */
export const getListById = query({
  args: { listId: v.id("userLists") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.listId);
  },
});

/**
 * Create a new list
 */
export const createList = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    listType: listTypeValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const listId = await ctx.db.insert("userLists", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      listType: args.listType,
      players: [],
      links: [],
      createdAt: now,
      updatedAt: now,
    });

    return listId;
  },
});

/**
 * Update list metadata (name, description)
 */
export const updateList = mutation({
  args: {
    listId: v.id("userLists"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      listType: v.optional(listTypeValidator),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.listId, {
      ...args.updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Soft delete a list
 */
export const deleteList = mutation({
  args: { listId: v.id("userLists") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.listId, {
      deletedAt: Date.now(),
    });
  },
});

/**
 * Add a player to a list
 */
export const addPlayerToList = mutation({
  args: {
    listId: v.id("userLists"),
    playerId: v.string(),
    sport: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    const listType = resolveListType(list);
    const maxPlayers = getMaxPlayersForListType(listType);

    // Check if player already exists in the list
    const playerExists = list.players.some((p) => p.playerId === args.playerId);
    if (playerExists) {
      return { success: false, reason: "already_exists" };
    }

    if (list.players.length >= maxPlayers) {
      return {
        success: false,
        reason: "list_type_limit",
        listType,
        maxPlayers,
      };
    }

    // Add player to the end of the list
    await ctx.db.patch(args.listId, {
      players: [
        ...list.players,
        {
          playerId: args.playerId,
          sport: args.sport,
          order: list.players.length,
          addedAt: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Remove a player from a list
 */
export const removePlayerFromList = mutation({
  args: {
    listId: v.id("userLists"),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Filter out the player and reorder
    const filteredPlayers = list.players
      .filter((p) => p.playerId !== args.playerId)
      .map((p, idx) => ({ ...p, order: idx }));

    await ctx.db.patch(args.listId, {
      players: filteredPlayers,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Reorder players in a list (after drag and drop)
 */
export const reorderPlayersInList = mutation({
  args: {
    listId: v.id("userLists"),
    newOrder: v.array(
      v.object({
        playerId: v.string(),
        sport: v.optional(v.string()),
        order: v.number(),
        addedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Ensure order is sequential
    const reorderedPlayers = args.newOrder.map((p, idx) => ({
      ...p,
      order: idx,
    }));

    await ctx.db.patch(args.listId, {
      players: reorderedPlayers,
      updatedAt: Date.now(),
    });
  },
});

export const cloneSharedListToUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    listType: listTypeValidator,
    players: v.array(
      v.object({
        playerId: v.string(),
        sport: v.optional(v.string()),
        order: v.number(),
        addedAt: v.number(),
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("userLists", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      listType: args.listType,
      players: args.players,
      links: args.links,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Add a link to a list
 */
export const addLinkToList = mutation({
  args: {
    listId: v.id("userLists"),
    url: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Generate a unique ID for the link
    const linkId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

    const newLink = {
      id: linkId,
      url: args.url,
      title: args.title,
      order: list.links.length,
    };

    await ctx.db.patch(args.listId, {
      links: [...list.links, newLink],
      updatedAt: Date.now(),
    });

    return { linkId };
  },
});

/**
 * Update a link in a list
 */
export const updateLinkInList = mutation({
  args: {
    listId: v.id("userLists"),
    linkId: v.string(),
    updates: v.object({
      url: v.optional(v.string()),
      title: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    const updatedLinks = list.links.map((link) =>
      link.id === args.linkId ? { ...link, ...args.updates } : link
    );

    await ctx.db.patch(args.listId, {
      links: updatedLinks,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Remove a link from a list
 */
export const removeLinkFromList = mutation({
  args: {
    listId: v.id("userLists"),
    linkId: v.string(),
  },
  handler: async (ctx, args) => {
    const list = await ctx.db.get(args.listId);
    if (!list) {
      throw new Error("List not found");
    }

    // Filter out the link and reorder
    const filteredLinks = list.links
      .filter((l) => l.id !== args.linkId)
      .map((l, idx) => ({ ...l, order: idx }));

    await ctx.db.patch(args.listId, {
      links: filteredLinks,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Reorder links in a list
 */
export const reorderLinksInList = mutation({
  args: {
    listId: v.id("userLists"),
    newOrder: v.array(
      v.object({
        id: v.string(),
        url: v.string(),
        title: v.string(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Ensure order is sequential
    const reorderedLinks = args.newOrder.map((l, idx) => ({
      ...l,
      order: idx,
    }));

    await ctx.db.patch(args.listId, {
      links: reorderedLinks,
      updatedAt: Date.now(),
    });
  },
});
