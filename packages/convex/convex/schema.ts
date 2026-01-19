import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced from Clerk
  users: defineTable({
    clerkId: v.string(), // Clerk's user ID (identity.subject)
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    username: v.optional(v.string()), // Unique username chosen by user
    image: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  // User Lists - private lists owned by users
  userLists: defineTable({
    userId: v.string(), // Can be anonymousId or authenticated user._id
    name: v.string(),
    description: v.optional(v.string()),

    // Players stored as references with order
    players: v.array(
      v.object({
        playerId: v.string(),
        sport: v.optional(v.string()), // Sport for scoped player lookup
        order: v.number(),
        addedAt: v.number(),
      })
    ),

    // Links attached to the list
    links: v.array(
      v.object({
        id: v.string(),
        url: v.string(),
        title: v.string(),
        order: v.number(),
      })
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),

    // Soft delete support
    deletedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_deleted", ["deletedAt"]),

  // Player Links - custom links per player, per user
  playerLinks: defineTable({
    userId: v.string(),
    playerId: v.string(),
    url: v.string(),
    title: v.string(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_player", ["userId", "playerId"])
    .index("by_user", ["userId"]),

  // Recent Players - user's recent viewing activity (denormalized for performance)
  recentPlayers: defineTable({
    userId: v.string(),

    // Denormalized player data (snapshot at view time)
    playerId: v.string(),
    name: v.string(),
    sport: v.string(),
    team: v.string(),
    position: v.string(),
    number: v.string(),
    photoUrl: v.optional(v.string()),
    sportsReferenceUrl: v.optional(v.string()),
    stats: v.optional(v.any()), // Player stats object
    hallOfFame: v.optional(v.boolean()),

    // Activity tracking
    lastViewedAt: v.number(),
    viewCount: v.number(),
  })
    .index("by_user_viewed", ["userId", "lastViewedAt"])
    .index("by_user_player", ["userId", "playerId"]),

  // User Settings - theme and preferences
  userSettings: defineTable({
    userId: v.string(),
    theme: v.union(v.literal("light"), v.literal("dark")),

    // Future settings
    notifications: v.optional(v.boolean()),

    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Shared Lists - public snapshots of lists for sharing
  sharedLists: defineTable({
    shareId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),

    // Denormalized player data (snapshot at share time)
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

    // Links attached to the list
    links: v.array(
      v.object({
        id: v.string(),
        url: v.string(),
        title: v.string(),
        order: v.number(),
      })
    ),

    // Ownership
    userId: v.optional(v.string()),
    sharedBy: v.optional(v.string()),
    sharedByName: v.optional(v.string()),

    // Timestamps
    originalCreatedAt: v.number(),
    originalUpdatedAt: v.number(),
    sharedAt: v.number(),

    // Metadata
    isPublic: v.boolean(),
    viewCount: v.number(),
  })
    .index("by_share_id", ["shareId"])
    .index("by_user", ["userId"])
    .index("by_shared_at", ["sharedAt"]),
});
