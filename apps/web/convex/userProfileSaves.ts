import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const profileSaveTypeValidator = v.union(
  v.literal("receipt"),
  v.literal("playerStatSnapshot")
);

const linkedEntityTypeValidator = v.optional(
  v.union(
    v.literal("list"),
    v.literal("player"),
    v.literal("game"),
    v.literal("manual")
  )
);

export const getUserProfileSaves = query({
  args: {
    userId: v.string(),
    type: v.optional(profileSaveTypeValidator),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("userProfileSaves")
        .withIndex("by_user_type_created", (q) =>
          q.eq("userId", args.userId).eq("type", args.type!)
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("userProfileSaves")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const createProfileSave = mutation({
  args: {
    userId: v.string(),
    type: profileSaveTypeValidator,
    title: v.string(),
    subtitle: v.optional(v.string()),
    note: v.optional(v.string()),
    url: v.optional(v.string()),
    linkedEntityType: linkedEntityTypeValidator,
    linkedEntityId: v.optional(v.string()),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("userProfileSaves", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      subtitle: args.subtitle,
      note: args.note,
      url: args.url,
      linkedEntityType: args.linkedEntityType,
      linkedEntityId: args.linkedEntityId,
      payload: args.payload,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteProfileSave = mutation({
  args: {
    saveId: v.id("userProfileSaves"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.saveId);
  },
});
