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

  // Shared Players - public snapshots of individual players for sharing
  sharedPlayers: defineTable({
    shareId: v.string(),

    // Denormalized player data (snapshot at share time)
    playerId: v.string(),
    name: v.string(),
    sport: v.string(),
    team: v.string(),
    position: v.string(),
    number: v.string(),
    photoUrl: v.optional(v.string()),
    sportsReferenceUrl: v.optional(v.string()),
    stats: v.optional(v.any()),
    hallOfFame: v.optional(v.boolean()),

    // Links attached to the player
    links: v.array(
      v.object({
        id: v.string(),
        url: v.string(),
        title: v.string(),
        order: v.number(),
      })
    ),

    // Ownership
    sharedByName: v.optional(v.string()),

    // Timestamps
    sharedAt: v.number(),

    // Metadata
    isPublic: v.boolean(),
    viewCount: v.number(),
  })
    .index("by_share_id", ["shareId"])
    .index("by_shared_at", ["sharedAt"]),

  // ========================================
  // NBA Data Cache Tables (Ball Don't Lie API)
  // ========================================

  // Standings cache - Conference/Division standings
  nbaStandingsCache: defineTable({
    season: v.number(), // e.g., 2025
    data: v.any(), // Full standings response
    cachedAt: v.number(), // Unix timestamp for TTL checks
  }).index("by_season", ["season"]),

  // Games cache - Daily game scores
  nbaGamesCache: defineTable({
    date: v.string(), // YYYY-MM-DD format
    data: v.any(), // Games array for the day
    cachedAt: v.number(),
  }).index("by_date", ["date"]),

  // Player stats cache - Season averages per player
  nbaPlayerStatsCache: defineTable({
    playerId: v.number(), // Ball Don't Lie player ID
    season: v.number(),
    data: v.any(), // Season averages (basic + advanced)
    cachedAt: v.number(),
  }).index("by_player_season", ["playerId", "season"]),

  // Contracts cache - Player/Team contract data
  nbaContractsCache: defineTable({
    entityType: v.union(v.literal("player"), v.literal("team")),
    entityId: v.number(), // Player ID or Team ID
    data: v.any(), // Contract details
    cachedAt: v.number(),
  }).index("by_entity", ["entityType", "entityId"]),

  // Injuries cache - Current injury reports (global, not per-player)
  nbaInjuriesCache: defineTable({
    data: v.any(), // All current injuries
    cachedAt: v.number(),
  }),

  // Leaders cache - League stat leaders
  nbaLeadersCache: defineTable({
    season: v.number(),
    statType: v.string(), // e.g., "pts", "reb", "ast"
    data: v.any(), // Leaders array
    cachedAt: v.number(),
  }).index("by_season_stat", ["season", "statType"]),

  // NBA Draft Picks - Static data manually updated after trades/drafts
  nbaDraftPicks: defineTable({
    teamId: v.number(), // Ball Don't Lie team ID
    teamAbbreviation: v.string(), // e.g., "LAL", "BOS"
    picks: v.array(
      v.object({
        year: v.number(),
        round: v.number(),
        originalTeam: v.string(), // Team abbreviation that originally owned the pick
        conditions: v.optional(v.string()), // Protection conditions
        swapRights: v.optional(v.boolean()), // If this is a swap right
        viaTradeWith: v.optional(v.string()), // Team traded from
      })
    ),
    lastUpdated: v.number(),
  }).index("by_team", ["teamId"]),
});
