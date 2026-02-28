import { action, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  CACHE_TTL,
  createBallDontLieClient,
  getCurrentNBASeason,
  isCacheValid,
  type BDLContract,
} from "./lib/balldontlie";

const SALARY_MATCH_MULTIPLIER = 1.25;
const SALARY_MATCH_BUFFER = 100_000;
const MIN_ROSTER_SIZE = 13;
const MAX_ROSTER_SIZE = 15;

function generateShareId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function toUniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values));
}

type TeamSummary = {
  teamId: number;
  payrollBefore: number;
  payrollAfter: number;
  delta: number;
  rosterBefore: number;
  rosterAfter: number;
  salaryIn: number;
  salaryOut: number;
  incomingPlayers: Array<{ id: number; name: string }>;
  outgoingPlayers: Array<{ id: number; name: string }>;
};

type TradeSimulationResult = {
  isValid: boolean;
  requiresPro: boolean;
  reasons: string[];
  season: number;
  teamA: TeamSummary;
  teamB: TeamSummary;
};

async function getTeamContractsWithCache(
  ctx: any,
  teamId: number
): Promise<BDLContract[]> {
  const cached = await ctx.runQuery(internal.nba._getContractsCache, {
    entityType: "team",
    entityId: teamId,
  });

  if (cached && isCacheValid(cached.cachedAt, CACHE_TTL.CONTRACTS)) {
    return cached.data as BDLContract[];
  }

  const apiKey = process.env.BALLDONTLIE_API_KEY;
  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY not configured");
  }

  const client = createBallDontLieClient(apiKey);
  const contracts = await client.getTeamContracts(teamId);

  await ctx.runMutation(internal.nba._upsertContractsCache, {
    entityType: "team",
    entityId: teamId,
    data: contracts,
  });

  return contracts;
}

function buildCurrentSeasonSalaryMap(
  contracts: BDLContract[],
  season: number
): Map<number, { amount: number; name: string }> {
  const map = new Map<number, { amount: number; name: string }>();

  for (const contract of contracts) {
    if (contract.season !== season) continue;

    const existing = map.get(contract.player.id);
    const playerName = `${contract.player.first_name} ${contract.player.last_name}`;

    if (!existing || contract.amount > existing.amount) {
      map.set(contract.player.id, { amount: contract.amount, name: playerName });
    }
  }

  return map;
}

function sumSalary(
  ids: number[],
  salaryMap: Map<number, { amount: number; name: string }>
): number {
  return ids.reduce((total, id) => total + (salaryMap.get(id)?.amount ?? 0), 0);
}

function toPlayerNames(
  ids: number[],
  salaryMap: Map<number, { amount: number; name: string }>
): Array<{ id: number; name: string }> {
  return ids.map((id) => ({ id, name: salaryMap.get(id)?.name ?? `Player #${id}` }));
}

export const simulateTrade = action({
  args: {
    teamA: v.object({
      teamId: v.number(),
      outgoingPlayerIds: v.array(v.number()),
    }),
    teamB: v.object({
      teamId: v.number(),
      outgoingPlayerIds: v.array(v.number()),
    }),
    season: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<TradeSimulationResult> => {
    const { isProUser } = await ctx.runQuery(internal.nba._checkProStatus);

    const emptySummary: TeamSummary = {
      teamId: 0,
      payrollBefore: 0,
      payrollAfter: 0,
      delta: 0,
      rosterBefore: 0,
      rosterAfter: 0,
      salaryIn: 0,
      salaryOut: 0,
      incomingPlayers: [],
      outgoingPlayers: [],
    };

    if (!isProUser) {
      return {
        isValid: false,
        requiresPro: true,
        reasons: ["Pro subscription required to run trade simulations."],
        season: args.season ?? getCurrentNBASeason(),
        teamA: { ...emptySummary, teamId: args.teamA.teamId },
        teamB: { ...emptySummary, teamId: args.teamB.teamId },
      };
    }

    const reasons: string[] = [];

    if (args.teamA.teamId === args.teamB.teamId) {
      reasons.push("Select two different teams.");
    }

    const teamAOutgoing = toUniqueNumbers(args.teamA.outgoingPlayerIds);
    const teamBOutgoing = toUniqueNumbers(args.teamB.outgoingPlayerIds);

    if (teamAOutgoing.length === 0 || teamBOutgoing.length === 0) {
      reasons.push("Each team must send at least one player.");
    }

    const crossDuplicates = teamAOutgoing.filter((id) => teamBOutgoing.includes(id));
    if (crossDuplicates.length > 0) {
      reasons.push("A player cannot be outgoing for both teams.");
    }

    const season = args.season ?? getCurrentNBASeason();

    const [teamAContracts, teamBContracts] = await Promise.all([
      getTeamContractsWithCache(ctx, args.teamA.teamId),
      getTeamContractsWithCache(ctx, args.teamB.teamId),
    ]);

    const teamASalaryMap = buildCurrentSeasonSalaryMap(teamAContracts, season);
    const teamBSalaryMap = buildCurrentSeasonSalaryMap(teamBContracts, season);

    for (const playerId of teamAOutgoing) {
      if (!teamASalaryMap.has(playerId)) {
        reasons.push(`Team A cannot trade player ${playerId} (not on current-season roster/contracts).`);
      }
    }

    for (const playerId of teamBOutgoing) {
      if (!teamBSalaryMap.has(playerId)) {
        reasons.push(`Team B cannot trade player ${playerId} (not on current-season roster/contracts).`);
      }
    }

    const teamAPayrollBefore = sumSalary(Array.from(teamASalaryMap.keys()), teamASalaryMap);
    const teamBPayrollBefore = sumSalary(Array.from(teamBSalaryMap.keys()), teamBSalaryMap);

    const teamASalaryOut = sumSalary(teamAOutgoing, teamASalaryMap);
    const teamBSalaryOut = sumSalary(teamBOutgoing, teamBSalaryMap);

    const teamASalaryIn = teamBSalaryOut;
    const teamBSalaryIn = teamASalaryOut;

    const teamAPayrollAfter = teamAPayrollBefore - teamASalaryOut + teamASalaryIn;
    const teamBPayrollAfter = teamBPayrollBefore - teamBSalaryOut + teamBSalaryIn;

    const teamARosterBefore = teamASalaryMap.size;
    const teamBRosterBefore = teamBSalaryMap.size;

    const teamARosterAfter = teamARosterBefore - teamAOutgoing.length + teamBOutgoing.length;
    const teamBRosterAfter = teamBRosterBefore - teamBOutgoing.length + teamAOutgoing.length;

    if (teamASalaryIn > teamASalaryOut * SALARY_MATCH_MULTIPLIER + SALARY_MATCH_BUFFER) {
      reasons.push("Team A fails salary matching rules.");
    }

    if (teamBSalaryIn > teamBSalaryOut * SALARY_MATCH_MULTIPLIER + SALARY_MATCH_BUFFER) {
      reasons.push("Team B fails salary matching rules.");
    }

    if (teamARosterAfter < MIN_ROSTER_SIZE || teamARosterAfter > MAX_ROSTER_SIZE) {
      reasons.push(
        `Team A roster size would be ${teamARosterAfter}. Allowed range is ${MIN_ROSTER_SIZE}-${MAX_ROSTER_SIZE}.`
      );
    }

    if (teamBRosterAfter < MIN_ROSTER_SIZE || teamBRosterAfter > MAX_ROSTER_SIZE) {
      reasons.push(
        `Team B roster size would be ${teamBRosterAfter}. Allowed range is ${MIN_ROSTER_SIZE}-${MAX_ROSTER_SIZE}.`
      );
    }

    const teamAResult: TeamSummary = {
      teamId: args.teamA.teamId,
      payrollBefore: teamAPayrollBefore,
      payrollAfter: teamAPayrollAfter,
      delta: teamAPayrollAfter - teamAPayrollBefore,
      rosterBefore: teamARosterBefore,
      rosterAfter: teamARosterAfter,
      salaryIn: teamASalaryIn,
      salaryOut: teamASalaryOut,
      incomingPlayers: toPlayerNames(teamBOutgoing, teamBSalaryMap),
      outgoingPlayers: toPlayerNames(teamAOutgoing, teamASalaryMap),
    };

    const teamBResult: TeamSummary = {
      teamId: args.teamB.teamId,
      payrollBefore: teamBPayrollBefore,
      payrollAfter: teamBPayrollAfter,
      delta: teamBPayrollAfter - teamBPayrollBefore,
      rosterBefore: teamBRosterBefore,
      rosterAfter: teamBRosterAfter,
      salaryIn: teamBSalaryIn,
      salaryOut: teamBSalaryOut,
      incomingPlayers: toPlayerNames(teamAOutgoing, teamASalaryMap),
      outgoingPlayers: toPlayerNames(teamBOutgoing, teamBSalaryMap),
    };

    return {
      isValid: reasons.length === 0,
      requiresPro: false,
      reasons,
      season,
      teamA: teamAResult,
      teamB: teamBResult,
    };
  },
});

export const createTradeScenarioShare = mutation({
  args: {
    request: v.object({
      teamA: v.object({
        teamId: v.number(),
        outgoingPlayerIds: v.array(v.number()),
      }),
      teamB: v.object({
        teamId: v.number(),
        outgoingPlayerIds: v.array(v.number()),
      }),
      season: v.number(),
    }),
    result: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const { isProUser } = await ctx.runQuery(internal.nba._checkProStatus);
    if (!isProUser) {
      throw new Error("Pro subscription required");
    }

    let shareId = generateShareId();
    let existing = await ctx.db
      .query("tradeScenarios")
      .withIndex("by_share_id", (q) => q.eq("shareId", shareId))
      .first();

    while (existing) {
      shareId = generateShareId();
      existing = await ctx.db
        .query("tradeScenarios")
        .withIndex("by_share_id", (q) => q.eq("shareId", shareId))
        .first();
    }

    await ctx.db.insert("tradeScenarios", {
      shareId,
      ownerUserId: identity.subject,
      league: "nba",
      request: args.request,
      result: args.result,
      createdAt: Date.now(),
      isPublic: true,
      expiresAt: undefined,
    });

    return { shareId };
  },
});

export const getTradeScenarioByShareId = action({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    const scenario = await ctx.runQuery(internal.tradeSimulator._getScenarioByShareId, {
      shareId: args.shareId,
    });

    if (!scenario) {
      return null;
    }

    if (!scenario.isPublic) {
      return null;
    }

    if (scenario.expiresAt && scenario.expiresAt < Date.now()) {
      return null;
    }

    return {
      shareId: scenario.shareId,
      league: scenario.league,
      request: scenario.request,
      result: scenario.result,
      createdAt: scenario.createdAt,
    };
  },
});

export const _getScenarioByShareId = internalQuery({
  args: { shareId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tradeScenarios")
      .withIndex("by_share_id", (q) => q.eq("shareId", args.shareId))
      .first();
  },
});
