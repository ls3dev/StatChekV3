"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";

const TEAM_NAMES: Record<
  number,
  { name: string; city: string; abbreviation: string }
> = {
  1: { name: "Hawks", city: "Atlanta", abbreviation: "ATL" },
  2: { name: "Celtics", city: "Boston", abbreviation: "BOS" },
  3: { name: "Nets", city: "Brooklyn", abbreviation: "BKN" },
  4: { name: "Hornets", city: "Charlotte", abbreviation: "CHA" },
  5: { name: "Bulls", city: "Chicago", abbreviation: "CHI" },
  6: { name: "Cavaliers", city: "Cleveland", abbreviation: "CLE" },
  7: { name: "Mavericks", city: "Dallas", abbreviation: "DAL" },
  8: { name: "Nuggets", city: "Denver", abbreviation: "DEN" },
  9: { name: "Pistons", city: "Detroit", abbreviation: "DET" },
  10: { name: "Warriors", city: "Golden State", abbreviation: "GSW" },
  11: { name: "Rockets", city: "Houston", abbreviation: "HOU" },
  12: { name: "Pacers", city: "Indiana", abbreviation: "IND" },
  13: { name: "Clippers", city: "LA", abbreviation: "LAC" },
  14: { name: "Lakers", city: "Los Angeles", abbreviation: "LAL" },
  15: { name: "Grizzlies", city: "Memphis", abbreviation: "MEM" },
  16: { name: "Heat", city: "Miami", abbreviation: "MIA" },
  17: { name: "Bucks", city: "Milwaukee", abbreviation: "MIL" },
  18: { name: "Timberwolves", city: "Minnesota", abbreviation: "MIN" },
  19: { name: "Pelicans", city: "New Orleans", abbreviation: "NOP" },
  20: { name: "Knicks", city: "New York", abbreviation: "NYK" },
  21: { name: "Thunder", city: "Oklahoma City", abbreviation: "OKC" },
  22: { name: "Magic", city: "Orlando", abbreviation: "ORL" },
  23: { name: "76ers", city: "Philadelphia", abbreviation: "PHI" },
  24: { name: "Suns", city: "Phoenix", abbreviation: "PHX" },
  25: { name: "Trail Blazers", city: "Portland", abbreviation: "POR" },
  26: { name: "Kings", city: "Sacramento", abbreviation: "SAC" },
  27: { name: "Spurs", city: "San Antonio", abbreviation: "SAS" },
  28: { name: "Raptors", city: "Toronto", abbreviation: "TOR" },
  29: { name: "Jazz", city: "Utah", abbreviation: "UTA" },
  30: { name: "Wizards", city: "Washington", abbreviation: "WAS" },
};

interface Contract {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
  };
  season: number;
  amount: number;
  currency: string;
}

interface Injury {
  player: {
    id: number;
    first_name: string;
    last_name: string;
  };
  status: string;
  description: string;
  return_date: string | null;
}

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

function getInjuryStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes("out")) return "bg-red-500/20 text-red-400";
  if (s.includes("doubtful")) return "bg-red-500/10 text-red-300";
  if (s.includes("questionable")) return "bg-yellow-500/20 text-yellow-400";
  if (s.includes("probable") || s.includes("day-to-day"))
    return "bg-green-500/20 text-green-400";
  return "bg-gray-500/20 text-gray-400";
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = parseInt(params.id as string, 10);
  const teamInfo = TEAM_NAMES[teamId];

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLoadingInjuries, setIsLoadingInjuries] = useState(true);
  const [contractsRequiresPro, setContractsRequiresPro] = useState(false);
  const [injuriesRequiresPro, setInjuriesRequiresPro] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTeamContracts = useAction(api.nba.getTeamContracts);
  const getInjuries = useAction(api.nba.getInjuries);

  const fetchData = useCallback(async () => {
    setError(null);

    // Fetch contracts
    setIsLoadingContracts(true);
    try {
      const result = await getTeamContracts({ teamId });
      if (result.requiresPro) {
        setContractsRequiresPro(true);
      } else {
        setContracts(result.contracts as Contract[]);
        setContractsRequiresPro(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch contracts:", err);
    } finally {
      setIsLoadingContracts(false);
    }

    // Fetch injuries
    setIsLoadingInjuries(true);
    try {
      const result = await getInjuries({ teamId });
      if (result.requiresPro) {
        setInjuriesRequiresPro(true);
      } else {
        setInjuries(result.injuries as Injury[]);
        setInjuriesRequiresPro(false);
      }
    } catch (err: any) {
      console.error("Failed to fetch injuries:", err);
    } finally {
      setIsLoadingInjuries(false);
    }
  }, [getTeamContracts, getInjuries, teamId]);

  useEffect(() => {
    if (teamId) {
      fetchData();
    }
  }, [teamId]);

  const playerContracts = useMemo(() => {
    const grouped: Record<
      number,
      { player: Contract["player"]; contracts: Contract[] }
    > = {};
    contracts.forEach((contract) => {
      if (!grouped[contract.player.id]) {
        grouped[contract.player.id] = {
          player: contract.player,
          contracts: [],
        };
      }
      grouped[contract.player.id].contracts.push(contract);
    });
    return Object.values(grouped).sort((a, b) => {
      const aCurrentSalary =
        a.contracts.find((c) => c.season === new Date().getFullYear())
          ?.amount || 0;
      const bCurrentSalary =
        b.contracts.find((c) => c.season === new Date().getFullYear())
          ?.amount || 0;
      return bCurrentSalary - aCurrentSalary;
    });
  }, [contracts]);

  const teamTotals = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let totalSalary = 0;
    contracts.forEach((contract) => {
      if (contract.season === currentYear) {
        totalSalary += contract.amount;
      }
    });
    return { totalSalary, playerCount: playerContracts.length };
  }, [contracts, playerContracts]);

  if (!teamInfo) {
    return (
      <main className="min-h-screen bg-background-primary flex flex-col items-center justify-center">
        <svg
          className="w-12 h-12 text-text-muted mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-text-muted">Team not found</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {/* Team Header */}
        <div className="bg-card rounded-xl p-6 text-center mb-6 border-b border-white/5">
          <p className="text-4xl font-extrabold text-accent-purple">
            {teamInfo.abbreviation}
          </p>
          <p className="text-text-secondary mt-1">
            {teamInfo.city} {teamInfo.name}
          </p>
        </div>

        {/* Injury Report Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-accent-purple"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-text-primary flex-1">
              Injury Report
            </h2>
            <span className="bg-accent-purple px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
              PRO
            </span>
          </div>

          {isLoadingInjuries ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : injuriesRequiresPro ? (
            <div className="bg-card rounded-xl p-6 text-center">
              <svg
                className="w-10 h-10 text-text-muted mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-text-secondary text-sm mb-3">
                Injury reports are a Pro feature
              </p>
              <button className="px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:bg-purple-500 transition-colors">
                Unlock Pro
              </button>
            </div>
          ) : injuries.length === 0 ? (
            <div className="bg-card rounded-xl p-4 flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-text-secondary">No reported injuries</p>
            </div>
          ) : (
            <div className="space-y-3">
              {injuries.map((injury, index) => (
                <div
                  key={`${injury.player.id}-${index}`}
                  className="bg-card rounded-xl p-4"
                >
                  <p className="font-semibold text-text-primary mb-2">
                    {injury.player.first_name} {injury.player.last_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getInjuryStatusColor(injury.status)}`}
                    >
                      {injury.status}
                    </span>
                    {injury.description && (
                      <span className="text-xs text-text-secondary">
                        {injury.description}
                      </span>
                    )}
                    {injury.return_date && (
                      <span className="text-xs text-text-muted">
                        Return: {injury.return_date}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Payroll Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-accent-purple"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-text-primary flex-1">
              Team Payroll
            </h2>
            <span className="bg-accent-purple px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
              PRO
            </span>
          </div>

          {isLoadingContracts ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : contractsRequiresPro ? (
            <div className="bg-card rounded-xl p-6 text-center">
              <svg
                className="w-10 h-10 text-text-muted mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-text-secondary text-sm mb-3">
                Team payroll is a Pro feature
              </p>
              <button className="px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:bg-purple-500 transition-colors">
                Unlock Pro
              </button>
            </div>
          ) : (
            <>
              {/* Team Summary */}
              <div className="bg-card rounded-xl p-4 flex mb-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary mb-0.5">
                    Total Payroll
                  </p>
                  <p className="font-semibold text-text-primary">
                    {formatCurrency(teamTotals.totalSalary)}
                  </p>
                </div>
                <div className="w-px bg-white/10" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary mb-0.5">Players</p>
                  <p className="font-semibold text-text-primary">
                    {teamTotals.playerCount}
                  </p>
                </div>
              </div>

              {/* Player Contracts List */}
              <div className="bg-card rounded-xl overflow-hidden">
                {playerContracts.map((pc) => {
                  const currentSalary = pc.contracts.find(
                    (c) => c.season === new Date().getFullYear()
                  );
                  return (
                    <div
                      key={pc.player.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-text-primary">
                          {pc.player.first_name} {pc.player.last_name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {pc.player.position || "N/A"}
                        </p>
                      </div>
                      <p className="font-semibold text-text-primary tabular-nums">
                        {currentSalary
                          ? formatCurrency(currentSalary.amount)
                          : "N/A"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
