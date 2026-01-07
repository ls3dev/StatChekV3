import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get user settings (returns defaults if not found)
 */
export const getUserSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Return defaults if no settings exist yet
    if (!settings) {
      return {
        theme: "dark" as const,
        notifications: true,
      };
    }

    return {
      theme: settings.theme,
      notifications: settings.notifications ?? true,
    };
  },
});

/**
 * Update user settings (upsert)
 */
export const updateUserSettings = mutation({
  args: {
    userId: v.string(),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    notifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const updates = {
      ...(args.theme && { theme: args.theme }),
      ...(args.notifications !== undefined && {
        notifications: args.notifications,
      }),
      updatedAt: Date.now(),
    };

    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, updates);
    } else {
      // Create new settings
      await ctx.db.insert("userSettings", {
        userId: args.userId,
        theme: args.theme ?? "dark",
        notifications: args.notifications ?? true,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Set theme preference
 */
export const setTheme = mutation({
  args: {
    userId: v.string(),
    theme: v.union(v.literal("light"), v.literal("dark")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        theme: args.theme,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId: args.userId,
        theme: args.theme,
        notifications: true,
        updatedAt: Date.now(),
      });
    }
  },
});
