"use client";

import { useState } from "react";
import { MatchupCardCompact } from "./MatchupCard";
import { NCAABGameDetailModal } from "./NCAABGameDetailModal";
import { ROUND_LABELS } from "@convex/lib/ncaabBracket";
import type { NCAABBracketGame } from "@convex/lib/ncaabBracket";

interface OrganizedBracket {
  regions: Record<string, Record<number, NCAABBracketGame[]>>;
  finalFour: NCAABBracketGame[];
  championship: NCAABBracketGame[];
  rounds: number[];
  regionNames: string[];
}

function RoundColumn({
  games,
  roundNum,
  spacing,
  runByGameId,
  onGameClick,
}: {
  games: NCAABBracketGame[];
  roundNum: number;
  spacing: number;
  runByGameId?: Record<string, { team: "home" | "visitor"; points: number } | null>;
  onGameClick: (game: NCAABBracketGame) => void;
}) {
  return (
    <div className="flex flex-col justify-around" style={{ gap: `${spacing}px` }}>
      {games.map((game, i) => (
        <div key={game.game_id ?? i} className="relative">
          <MatchupCardCompact
            game={game}
            currentRun={game.game_id != null ? runByGameId?.[String(game.game_id)] ?? null : null}
            onClick={() => onGameClick(game)}
          />
        </div>
      ))}
    </div>
  );
}

function RegionBracket({
  regionName,
  games,
  rounds,
  reverse,
  runByGameId,
  onGameClick,
}: {
  regionName: string;
  games: Record<number, NCAABBracketGame[]>;
  rounds: number[];
  reverse?: boolean;
  runByGameId?: Record<string, { team: "home" | "visitor"; points: number } | null>;
  onGameClick: (game: NCAABBracketGame) => void;
}) {
  // Rounds 1-4 for regions (skip First Four / round 0)
  const regionRounds = rounds.filter((r) => r >= 1 && r <= 4);
  const columns = reverse ? [...regionRounds].reverse() : regionRounds;

  return (
    <div className="flex-1">
      <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3 text-center">
        {regionName}
      </p>
      <div className={`flex gap-3 ${reverse ? "flex-row-reverse" : ""}`}>
        {columns.map((round, colIdx) => {
          const roundGames = games[round] ?? [];
          // Each round doubles the spacing
          const baseSpacing = 8;
          const actualIdx = reverse ? regionRounds.length - 1 - colIdx : colIdx;
          const spacing = baseSpacing * Math.pow(2, actualIdx);
          return (
            <div key={round} className="flex flex-col">
              <p className="text-[10px] text-text-muted text-center mb-2">
                {ROUND_LABELS[round]}
              </p>
              <RoundColumn
                games={roundGames}
                roundNum={round}
                spacing={spacing}
                runByGameId={runByGameId}
                onGameClick={onGameClick}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FullBracket({
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

  // Arrange regions: top-left, bottom-left feed left; top-right, bottom-right feed right
  const regions = bracket.regionNames.filter((r) => r !== "First Four");
  const topLeft = regions[0];
  const bottomLeft = regions[1];
  const topRight = regions[2];
  const bottomRight = regions[3];

  const rounds = bracket.rounds;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[1200px]">
        {/* Left side regions */}
        <div className="flex gap-6 items-start">
          {/* Left bracket */}
          <div className="flex-1 space-y-8">
            {topLeft && (
              <RegionBracket
                regionName={topLeft}
                games={bracket.regions[topLeft] ?? {}}
                rounds={rounds}
                runByGameId={runByGameId}
                onGameClick={handleGameClick}
              />
            )}
            {bottomLeft && (
              <RegionBracket
                regionName={bottomLeft}
                games={bracket.regions[bottomLeft] ?? {}}
                rounds={rounds}
                runByGameId={runByGameId}
                onGameClick={handleGameClick}
              />
            )}
          </div>

          {/* Center: Final Four + Championship */}
          <div className="flex flex-col items-center justify-center gap-6 px-4 min-w-[200px]">
            <p className="text-xs font-bold text-accent uppercase tracking-wider">
              Final Four
            </p>
            <div className="space-y-4">
              {bracket.finalFour.map((game, i) => (
                <MatchupCardCompact
                  key={game.game_id ?? `ff-${i}`}
                  game={game}
                  currentRun={game.game_id != null ? runByGameId?.[String(game.game_id)] ?? null : null}
                  onClick={() => handleGameClick(game)}
                />
              ))}
            </div>

            {bracket.championship.length > 0 && (
              <>
                <p className="text-xs font-bold text-gold uppercase tracking-wider mt-2">
                  Championship
                </p>
                <div className="space-y-4">
                  {bracket.championship.map((game, i) => (
                    <MatchupCardCompact
                      key={game.game_id ?? `champ-${i}`}
                      game={game}
                      currentRun={game.game_id != null ? runByGameId?.[String(game.game_id)] ?? null : null}
                      onClick={() => handleGameClick(game)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right bracket */}
          <div className="flex-1 space-y-8">
            {topRight && (
              <RegionBracket
                regionName={topRight}
                games={bracket.regions[topRight] ?? {}}
                rounds={rounds}
                reverse
                runByGameId={runByGameId}
                onGameClick={handleGameClick}
              />
            )}
            {bottomRight && (
              <RegionBracket
                regionName={bottomRight}
                games={bracket.regions[bottomRight] ?? {}}
                rounds={rounds}
                reverse
                runByGameId={runByGameId}
                onGameClick={handleGameClick}
              />
            )}
          </div>
        </div>
      </div>

      <NCAABGameDetailModal
        game={selectedGame}
        isOpen={showGameDetail}
        onClose={() => setShowGameDetail(false)}
      />
    </div>
  );
}
