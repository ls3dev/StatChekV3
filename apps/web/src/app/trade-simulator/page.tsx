"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { NBA_TEAMS, NBA_TEAM_LIST } from "@/lib/nbaTeams";

type Contract = {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
  };
  season: number;
  amount: number;
};

type TeamResult = {
  teamId: number;
  payrollBefore: number;
  payrollAfter: number;
  delta: number;
  rosterBefore: number;
  rosterAfter: number;
  salaryIn: number;
  salaryOut: number;
};

type SimulationResult = {
  isValid: boolean;
  requiresPro: boolean;
  reasons: string[];
  season: number;
  teamA: TeamResult;
  teamB: TeamResult;
};

function getCurrentNBASeason(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 10 ? year : year - 1;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function currentSeasonSalaries(contracts: Contract[], season: number) {
  const map = new Map<number, { id: number; name: string; position: string; amount: number }>();
  for (const contract of contracts) {
    if (contract.season !== season) continue;
    const existing = map.get(contract.player.id);
    const name = `${contract.player.first_name} ${contract.player.last_name}`;
    if (!existing || contract.amount > existing.amount) {
      map.set(contract.player.id, {
        id: contract.player.id,
        name,
        position: contract.player.position || "N/A",
        amount: contract.amount,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

export default function TradeSimulatorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTeamIdParam = searchParams.get("fromTeamId");

  const teamAId = useMemo(() => {
    const parsed = Number(fromTeamIdParam);
    return Number.isFinite(parsed) && NBA_TEAMS[parsed] ? parsed : 1;
  }, [fromTeamIdParam]);

  const [teamBId, setTeamBId] = useState(() => (teamAId === 2 ? 1 : 2));
  const [teamAOutgoing, setTeamAOutgoing] = useState<number[]>([]);
  const [teamBOutgoing, setTeamBOutgoing] = useState<number[]>([]);
  const [teamAData, setTeamAData] = useState<Contract[]>([]);
  const [teamBData, setTeamBData] = useState<Contract[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const proAccess = useQuery(api.nba.checkProAccess);
  const teamContractsAction = useAction(api.nba.getTeamContracts);
  const simulateTrade = useAction(api.tradeSimulator.simulateTrade);
  const createTradeScenarioShare = useMutation(api.tradeSimulator.createTradeScenarioShare);

  const season = getCurrentNBASeason();

  const loadContracts = useCallback(async () => {
    if (!proAccess?.isProUser) return;

    setIsLoading(true);
    setError(null);
    try {
      const [a, b] = await Promise.all([
        teamContractsAction({ teamId: teamAId }),
        teamContractsAction({ teamId: teamBId }),
      ]);

      if (a.requiresPro || b.requiresPro) {
        setError("Pro subscription required to load team contracts.");
        return;
      }

      setTeamAData((a.contracts ?? []) as Contract[]);
      setTeamBData((b.contracts ?? []) as Contract[]);
    } catch (loadError) {
      console.error("Failed loading contracts", loadError);
      setError("Failed to load team contracts.");
    } finally {
      setIsLoading(false);
    }
  }, [proAccess?.isProUser, teamContractsAction, teamAId, teamBId]);

  useEffect(() => {
    setTeamAOutgoing([]);
    setTeamBOutgoing([]);
    setResult(null);
    setShareMessage(null);
    loadContracts();
  }, [teamAId, teamBId, loadContracts]);

  const teamAPlayers = useMemo(() => currentSeasonSalaries(teamAData, season), [teamAData, season]);
  const teamBPlayers = useMemo(() => currentSeasonSalaries(teamBData, season), [teamBData, season]);

  const toggleOutgoing = (team: "A" | "B", playerId: number) => {
    if (team === "A") {
      setTeamAOutgoing((prev) =>
        prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
      );
      return;
    }
    setTeamBOutgoing((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const validateTrade = async () => {
    if (!proAccess?.isProUser) {
      setError("Pro subscription required to run trade simulations.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShareMessage(null);
    try {
      const simulation = (await simulateTrade({
        teamA: { teamId: teamAId, outgoingPlayerIds: teamAOutgoing },
        teamB: { teamId: teamBId, outgoingPlayerIds: teamBOutgoing },
        season,
      })) as SimulationResult;
      setResult(simulation);
    } catch (simulationError) {
      console.error("Trade simulation failed", simulationError);
      setError("Could not validate this trade.");
    } finally {
      setIsLoading(false);
    }
  };

  const shareScenario = async () => {
    if (!result) return;
    setIsSharing(true);
    setError(null);
    try {
      const { shareId } = await createTradeScenarioShare({
        request: {
          teamA: { teamId: teamAId, outgoingPlayerIds: teamAOutgoing },
          teamB: { teamId: teamBId, outgoingPlayerIds: teamBOutgoing },
          season,
        },
        result,
      });

      const shareUrl = `${window.location.origin}/trade/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Share link copied to clipboard.");
    } catch (shareError) {
      console.error("Sharing trade failed", shareError);
      setError("Could not create a share link.");
    } finally {
      setIsSharing(false);
    }
  };

  const teamAInfo = NBA_TEAMS[teamAId];
  const teamBInfo = NBA_TEAMS[teamBId];

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back
        </button>

        <div className="bg-card rounded-xl p-6 border border-white/5 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Trade Simulator</h1>
          <p className="text-text-secondary mt-1">
            Validate NBA trade salary and roster rules for {season}-{(season + 1).toString().slice(-2)}.
          </p>
          {!proAccess?.isProUser && (
            <p className="mt-3 text-sm text-yellow-300">
              Pro subscription required to run simulations and create share links.
            </p>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {shareMessage && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 text-green-300 rounded-lg px-4 py-3 text-sm">
            {shareMessage}
          </div>
        )}

        <div className="bg-card rounded-xl p-4 border border-white/5 mb-6">
          <p className="text-sm font-semibold text-text-primary mb-3">Counterpart Team</p>
          <div className="flex flex-wrap gap-2">
            {NBA_TEAM_LIST.filter((team) => team.id !== teamAId).map((team) => {
              const selected = team.id === teamBId;
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setTeamBId(team.id)}
                  className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
                    selected
                      ? "bg-accent-purple border-accent-purple text-white"
                      : "border-white/15 text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {team.abbreviation}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-white/5">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="font-semibold text-text-primary">
                {teamAInfo.city} {teamAInfo.name} outgoing
              </p>
            </div>
            <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
              {teamAPlayers.map((player) => {
                const selected = teamAOutgoing.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => toggleOutgoing("A", player.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      selected
                        ? "border-accent-purple bg-accent-purple/20"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{player.name}</p>
                        <p className="text-xs text-text-secondary">{player.position}</p>
                      </div>
                      <p className="text-sm font-semibold text-text-primary tabular-nums">
                        {formatCurrency(player.amount)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-white/5">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="font-semibold text-text-primary">
                {teamBInfo.city} {teamBInfo.name} outgoing
              </p>
            </div>
            <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
              {teamBPlayers.map((player) => {
                const selected = teamBOutgoing.includes(player.id);
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => toggleOutgoing("B", player.id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      selected
                        ? "border-accent-purple bg-accent-purple/20"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{player.name}</p>
                        <p className="text-xs text-text-secondary">{player.position}</p>
                      </div>
                      <p className="text-sm font-semibold text-text-primary tabular-nums">
                        {formatCurrency(player.amount)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={validateTrade}
            disabled={isLoading}
            className="px-5 py-2.5 bg-accent-purple hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
          >
            {isLoading ? "Validating..." : "Validate Trade"}
          </button>
        </div>

        {result && (
          <div className="mt-6 bg-card rounded-xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  result.isValid ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <h2 className="text-xl font-bold text-text-primary">
                {result.isValid ? "Trade Valid" : "Trade Invalid"}
              </h2>
            </div>

            {result.reasons.length > 0 && (
              <div className="mb-4 space-y-1">
                {result.reasons.map((reason, index) => (
                  <p key={`${reason}-${index}`} className="text-sm text-text-secondary">
                    • {reason}
                  </p>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <div className="border border-white/10 rounded-lg p-3">
                <p className="font-semibold text-text-primary mb-1">{teamAInfo.abbreviation}</p>
                <p className="text-sm text-text-secondary">
                  Payroll: {formatCurrency(result.teamA.payrollBefore)} →{" "}
                  {formatCurrency(result.teamA.payrollAfter)}
                </p>
                <p className="text-sm text-text-secondary">Delta: {formatCurrency(result.teamA.delta)}</p>
                <p className="text-sm text-text-secondary">
                  Roster: {result.teamA.rosterBefore} → {result.teamA.rosterAfter}
                </p>
              </div>
              <div className="border border-white/10 rounded-lg p-3">
                <p className="font-semibold text-text-primary mb-1">{teamBInfo.abbreviation}</p>
                <p className="text-sm text-text-secondary">
                  Payroll: {formatCurrency(result.teamB.payrollBefore)} →{" "}
                  {formatCurrency(result.teamB.payrollAfter)}
                </p>
                <p className="text-sm text-text-secondary">Delta: {formatCurrency(result.teamB.delta)}</p>
                <p className="text-sm text-text-secondary">
                  Roster: {result.teamB.rosterBefore} → {result.teamB.rosterAfter}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={shareScenario}
              disabled={isSharing}
              className="mt-4 px-4 py-2 bg-background-secondary hover:bg-white/10 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-text-primary transition-colors"
            >
              {isSharing ? "Creating Link..." : "Create Share Link"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
