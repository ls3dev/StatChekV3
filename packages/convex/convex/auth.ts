import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create an anonymous user session
 * Called on app launch to establish user identity
 */
export const getOrCreateAnonymousUser = mutation({
  args: { anonymousId: v.string() },
  handler: async (ctx, args) => {
    // Check if anonymous user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_anonymous_id", (q) =>
        q.eq("anonymousId", args.anonymousId)
      )
      .first();

    if (existing) {
      // Update last active timestamp
      await ctx.db.patch(existing._id, {
        lastActiveAt: Date.now(),
      });
      return existing._id;
    }

    // Create new anonymous user
    const userId = await ctx.db.insert("users", {
      isAnonymous: true,
      anonymousId: args.anonymousId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Upgrade an anonymous user to an authenticated account
 * Transfers all data to the authenticated user
 */
export const upgradeAnonymousUser = mutation({
  args: {
    anonymousId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the anonymous user
    const anonUser = await ctx.db
      .query("users")
      .withIndex("by_anonymous_id", (q) =>
        q.eq("anonymousId", args.anonymousId)
      )
      .first();

    if (!anonUser) {
      throw new Error("Anonymous user not found");
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Upgrade the anonymous user to authenticated
    await ctx.db.patch(anonUser._id, {
      isAnonymous: false,
      email: args.email,
      name: args.name,
      image: args.image,
      emailVerified: Date.now(),
      lastActiveAt: Date.now(),
    });

    return {
      userId: anonUser._id,
      success: true,
    };
  },
});

/**
 * Get user by anonymous ID
 */
export const getUserByAnonymousId = query({
  args: { anonymousId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_anonymous_id", (q) =>
        q.eq("anonymousId", args.anonymousId)
      )
      .first();
  },
});

/**
 * Get user by email (for Better Auth integration)
 */
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * Create an authenticated user (for Better Auth integration)
 */
export const createAuthUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      image: args.image,
      isAnonymous: false,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Update user information
 */
export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      ...args.updates,
      lastActiveAt: Date.now(),
    });
  },
});
