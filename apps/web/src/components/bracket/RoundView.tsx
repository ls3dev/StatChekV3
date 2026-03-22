"use client";

import { useState } from "react";
import { MatchupCard } from "./MatchupCard";
import { NCAABGameDetailModal } from "./NCAABGameDetailModal";
import type { NCAABBracketGame } from "@convex/lib/ncaabBracket";

const SHORT_ROUND_LABELS: Record<number, string> = {
  0: "First Four",
  1: "Rd of 64",
  2: "Rd of 32",
  3: "Sweet 16",
  4: "Elite 8",
  5: "Final 4",
  6: "Title",
};

interface OrganizedBracket {
  regions: Record<string, Record<number, NCAABBracketGame[]>>;
  finalFour: NCAABBracketGame[];
  championship: NCAABBracketGame[];
  rounds: number[];
  regionNames: string[];
}

function getRoundProgress(
  bracket: OrganizedBracket,
  round: number
): { completed: number; total: number } {
  let games: NCAABBracketGame[] = [];
  if (round === 6) games = bracket.championship;
  else if (round === 5) games = bracket.finalFour;
  else {
    for (const region of bracket.regionNames) {
      games.push(...(bracket.regions[region]?.[round] ?? []));
    }
  }
  const total = games.length;
  const completed = games.filter(
    (g) => g.status === "Final" || g.status === "final" || g.status === "post"
  ).length;
  return { completed, total };
}

export function RoundView({
  bracket,
  runByGameId,
}: {
  bracket: OrganizedBracket;
  runByGameId?: Record<string, { team: "home" | "visitor"; points: number } | null>;
}) {
  const [selectedGame, setSelectedGame] = useState<NCAABBracketGame | null>(null);
  const [showGameDetail, setShowGameDetail] = useState(false);

  const handleGameClick = (game: NCAABBracketGame) => {
    setSelectedGame(game);
    setShowGameDetail(true);
  };

  const [selectedRound, setSelectedRound] = useState<number>(() => {
    const roundsWithGames = bracket.rounds.filter((r) => {
      if (r >= 5)
        return bracket.finalFour.length > 0 || bracket.championship.length > 0;
      return bracket.regionNames.some(
        (region) => (bracket.regions[region]?.[r]?.length ?? 0) > 0
      );
    });
    return roundsWithGames[roundsWithGames.length - 1] ?? 1;
  });

  const { completed, total } = getRoundProgress(bracket, selectedRound);
  const progressPct = total > 0 ? (completed / total) * 100 : 0;

  const isRegionRound = selectedRound < 5;

  // Get games grouped by region for region rounds
  const getRegionGames = (): [string, NCAABBracketGame[]][] => {
    if (!isRegionRound) return [];
    return bracket.regionNames
      .map((region) => [region, bracket.regions[region]?.[selectedRound] ?? []] as [string, NCAABBracketGame[]])
      .filter(([, games]) => games.length > 0);
  };

  const getNonRegionGames = (): NCAABBracketGame[] => {
    if (selectedRound === 6) return bracket.championship;
    if (selectedRound === 5) return bracket.finalFour;
    return [];
  };

  const regionGames = getRegionGames();
  const nonRegionGames = getNonRegionGames();
  const hasGames = isRegionRound
    ? regionGames.length > 0
    : nonRegionGames.length > 0;

  return (
    <div>
      {/* Sticky round navigation */}
      <div className="sticky top-0 z-10 bg-background-primary pb-3">
        {/* Round pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {bracket.rounds.map((round) => (
            <button
              key={round}
              onClick={() => setSelectedRound(round)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                selectedRound === round
                  ? "bg-accent text-white"
                  : "bg-background-secondary text-text-secondary hover:text-text-primary"
              }`}
            >
              {SHORT_ROUND_LABELS[round] ?? `Round ${round}`}
            </button>
          ))}
        </div>

        {/* Progress line */}
        {total > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-text-muted">
                {completed} of {total} complete
              </span>
            </div>
            <div className="h-1 bg-background-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Games */}
      {!hasGames ? (
        <div className="text-center py-12 text-text-muted text-sm">
          No games for this round yet
        </div>
      ) : isRegionRound ? (
        <div className="space-y-4">
          {regionGames.map(([region, games]) => (
            <div key={region}>
              {/* Region section header */}
              <div className="border-l-2 border-accent bg-background-secondary/50 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-accent uppercase tracking-wider">
                  {region}
                </span>
                <span className="text-xs text-text-muted">
                  {games.length} {games.length === 1 ? "game" : "games"}
                </span>
              </div>
              <div className="space-y-2">
                {games.map((game, i) => (
                  <MatchupCard
                    key={game.game_id ?? i}
                    game={game}
                    currentRun={game.game_id != null ? runByGameId?.[String(game.game_id)] ?? null : null}
                    onClick={() => handleGameClick(game)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {nonRegionGames.map((game, i) => (
            <MatchupCard
              key={game.game_id ?? i}
              game={game}
              currentRun={game.game_id != null ? runByGameId?.[String(game.game_id)] ?? null : null}
              onClick={() => handleGameClick(game)}
            />
          ))}
        </div>
      )}

      <NCAABGameDetailModal
        game={selectedGame}
        isOpen={showGameDetail}
        onClose={() => setShowGameDetail(false)}
      />
    </div>
  );
}
