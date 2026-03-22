import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteAccount = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Delete all user lists
    const lists = await ctx.db
      .query("userLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const list of lists) {
      await ctx.db.delete(list._id);
    }

    // Delete all player links
    const links = await ctx.db
      .query("playerLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    // Delete all recent players
    const recentPlayers = await ctx.db
      .query("recentPlayers")
      .withIndex("by_user_viewed", (q) => q.eq("userId", userId))
      .collect();
    for (const rp of recentPlayers) {
      await ctx.db.delete(rp._id);
    }

    // Delete user settings
    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (settings) {
      await ctx.db.delete(settings._id);
    }

    // Delete the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
      .first();
    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});
