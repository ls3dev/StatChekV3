"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { NBA_TEAMS } from "@/lib/nbaTeams";

type TeamResult = {
  teamId: number;
  payrollBefore: number;
  payrollAfter: number;
  delta: number;
  rosterBefore: number;
  rosterAfter: number;
};

type SimulationResult = {
  isValid: boolean;
  reasons: string[];
  season: number;
  teamA: TeamResult;
  teamB: TeamResult;
};

type SharedScenario = {
  shareId: string;
  result: SimulationResult;
  createdAt: number;
};

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export default function SharedTradePage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;

  const getTradeScenarioByShareId = useAction(api.tradeSimulator.getTradeScenarioByShareId);

  const [scenario, setScenario] = useState<SharedScenario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!shareId) return;
      try {
        const response = (await getTradeScenarioByShareId({ shareId })) as SharedScenario | null;
        setScenario(response);
      } catch (error) {
        console.error("Failed loading shared trade scenario", error);
        setScenario(null);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [shareId, getTradeScenarioByShareId]);

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 text-text-secondary hover:text-text-primary transition-colors"
        >
          ← StatCheck Home
        </button>

        <div className="bg-card rounded-xl p-6 border border-white/5">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !scenario ? (
            <>
              <h1 className="text-xl font-bold text-text-primary mb-2">Trade scenario not found</h1>
              <p className="text-text-secondary text-sm">
                This link may be invalid, private, or expired.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${
                    scenario.result.isValid ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                <h1 className="text-2xl font-bold text-text-primary">
                  {scenario.result.isValid ? "Valid Trade" : "Invalid Trade"}
                </h1>
              </div>

              <p className="text-text-secondary text-sm mb-4">
                Season: {scenario.result.season}-{(scenario.result.season + 1).toString().slice(-2)}
              </p>

              {scenario.result.reasons.length > 0 && (
                <div className="mb-4 space-y-1">
                  {scenario.result.reasons.map((reason, index) => (
                    <p key={`${reason}-${index}`} className="text-sm text-text-secondary">
                      • {reason}
                    </p>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-3">
                {[scenario.result.teamA, scenario.result.teamB].map((team) => {
                  const info = NBA_TEAMS[team.teamId];
                  const label = info ? `${info.city} ${info.name}` : `Team ${team.teamId}`;
                  return (
                    <div key={team.teamId} className="border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-text-primary mb-1">{label}</p>
                      <p className="text-sm text-text-secondary">
                        Payroll: {formatCurrency(team.payrollBefore)} → {formatCurrency(team.payrollAfter)}
                      </p>
                      <p className="text-sm text-text-secondary">Delta: {formatCurrency(team.delta)}</p>
                      <p className="text-sm text-text-secondary">
                        Roster: {team.rosterBefore} → {team.rosterAfter}
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
