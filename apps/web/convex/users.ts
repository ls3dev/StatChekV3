import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create user from Clerk identity
 * Called on authentication to sync Clerk user to Convex
 */
export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (existingUser) {
      // Update user info if changed
      await ctx.db.patch(existingUser._id, {
        email: identity.email,
        name: identity.name,
        image: identity.pictureUrl,
        updatedAt: Date.now(),
      });
      return {
        id: identity.subject, // Use Clerk ID as the userId for data queries
        clerkId: identity.subject,
        email: identity.email,
        name: identity.name,
        username: existingUser.username,
        image: identity.pictureUrl,
      };
    }

    // Create new user
    await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email,
      name: identity.name,
      image: identity.pictureUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      id: identity.subject, // Use Clerk ID as the userId for data queries
      clerkId: identity.subject,
      email: identity.email,
      name: identity.name,
      username: undefined,
      image: identity.pictureUrl,
    };
  },
});

/**
 * Get current user (already synced)
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      // User not synced yet, return basic info from identity
      return {
        id: identity.subject,
        clerkId: identity.subject,
        email: identity.email,
        name: identity.name,
        username: undefined,
        image: identity.pictureUrl,
      };
    }

    return {
      id: identity.subject, // Use Clerk ID as the userId for data queries
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      username: user.username,
      image: user.image,
    };
  },
});

/**
 * Check if a username is available (case-insensitive)
 */
export const checkUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalizedUsername = args.username.toLowerCase();

    // Check if username exists (case-insensitive via manual check)
    const users = await ctx.db.query("users").collect();
    const exists = users.some(
      (user) => user.username?.toLowerCase() === normalizedUsername
    );

    return { available: !exists };
  },
});

/**
 * Set username for the current user
 * Validates format and uniqueness
 */
export const setUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Not authenticated" };
    }

    const username = args.username.trim();

    // Validate length (3-20 characters)
    if (username.length < 3 || username.length > 20) {
      return { success: false, error: "Username must be 3-20 characters" };
    }

    // Validate format (alphanumeric + underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { success: false, error: "Username can only contain letters, numbers, and underscores" };
    }

    // Check uniqueness (case-insensitive)
    const normalizedUsername = username.toLowerCase();
    const users = await ctx.db.query("users").collect();
    const exists = users.some(
      (user) => user.username?.toLowerCase() === normalizedUsername
    );

    if (exists) {
      return { success: false, error: "Username is already taken" };
    }

    // Get current user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // Update username
    await ctx.db.patch(existingUser._id, {
      username,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get current user's ID for data queries
 * Returns the Clerk subject (user ID) which is used as userId in data tables
 */
export const getCurrentUserId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity?.subject ?? null;
  },
});
