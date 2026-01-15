import { query, mutation } from "./_generated/server";

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
        image: identity.pictureUrl,
      };
    }

    return {
      id: identity.subject, // Use Clerk ID as the userId for data queries
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      image: user.image,
    };
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
