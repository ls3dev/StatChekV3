"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { RoundView } from "@/components/bracket/RoundView";
import { FullBracket } from "@/components/bracket/FullBracket";
import type { NCAABBracketGame } from "@convex/lib/ncaabBracket";
import { deriveRegionNames } from "@convex/lib/ncaabBracket";

interface OrganizedBracket {
  regions: Record<string, Record<number, NCAABBracketGame[]>>;
  finalFour: NCAABBracketGame[];
  championship: NCAABBracketGame[];
  rounds: number[];
  regionNames: string[];
}

function getGamePriority(game: NCAABBracketGame): number {
  const status = game.status ?? "";
  const isFinal = status === "Final" || status === "final" || status === "post";
  const isScheduled =
    !isFinal &&
    (status.includes("T") || status === "scheduled" || status === "pre" || status === "");
  const isLive = !isFinal && !isScheduled;

  if (isLive) return 0;
  if (isScheduled) return 1;
  return 2;
}

function sortBracketGames(games: NCAABBracketGame[]): NCAABBracketGame[] {
  return [...games].sort((a, b) => {
    const priorityDiff = getGamePriority(a) - getGamePriority(b);
    if (priorityDiff !== 0) return priorityDiff;

    const aLocation = a.bracket_location ?? Number.MAX_SAFE_INTEGER;
    const bLocation = b.bracket_location ?? Number.MAX_SAFE_INTEGER;
    if (aLocation !== bLocation) return aLocation - bLocation;

    const aDate = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER;
    if (aDate !== bDate) return aDate - bDate;

    return (a.game_id ?? Number.MAX_SAFE_INTEGER) - (b.game_id ?? Number.MAX_SAFE_INTEGER);
  });
}

function organizeBracket(games: NCAABBracketGame[]): OrganizedBracket {
  const regions: Record<string, Record<number, NCAABBracketGame[]>> = {};
  const finalFour: NCAABBracketGame[] = [];
  const championship: NCAABBracketGame[] = [];
  const roundSet = new Set<number>();
  const regionNameSet = new Set<string>();

  const regionNames_ = deriveRegionNames(games);

  for (const game of games) {
    roundSet.add(game.round);

    if (game.round >= 5) {
      if (game.round === 6) championship.push(game);
      else finalFour.push(game);
      continue;
    }

    let regionLabel: string;
    if (game.bracket_location !== null && game.bracket_location !== undefined) {
      if (game.round === 0) {
        regionLabel = "First Four";
      } else {
        const perRegion = Math.pow(2, 4 - game.round);
        const regionIdx = Math.ceil(game.bracket_location / perRegion);
        regionLabel = regionNames_[regionIdx] ?? `Region ${regionIdx}`;
      }
    } else {
      regionLabel = game.region_label ?? "Unknown";
    }

    regionNameSet.add(regionLabel);
    if (!regions[regionLabel]) regions[regionLabel] = {};
    if (!regions[regionLabel][game.round]) regions[regionLabel][game.round] = [];
    regions[regionLabel][game.round].push(game);
  }

  for (const regionName of Object.keys(regions)) {
    for (const round of Object.keys(regions[regionName])) {
      const roundNum = Number(round);
      regions[regionName][roundNum] = sortBracketGames(regions[regionName][roundNum]);
    }
  }

  const sortedFinalFour = sortBracketGames(finalFour);
  const sortedChampionship = sortBracketGames(championship);
  const sortedRegionNames = Array.from(regionNameSet).sort((a, b) => {
    const aGames = Object.values(regions[a] ?? {}).flat();
    const bGames = Object.values(regions[b] ?? {}).flat();
    const aBest = aGames.length > 0 ? Math.min(...aGames.map(getGamePriority)) : Number.MAX_SAFE_INTEGER;
    const bBest = bGames.length > 0 ? Math.min(...bGames.map(getGamePriority)) : Number.MAX_SAFE_INTEGER;
    if (aBest !== bBest) return aBest - bBest;
    return a.localeCompare(b);
  });

  return {
    regions,
    finalFour: sortedFinalFour,
    championship: sortedChampionship,
    rounds: Array.from(roundSet).sort((a, b) => a - b),
    regionNames: sortedRegionNames,
  };
}

export default function BracketPage() {
  const [games, setGames] = useState<NCAABBracketGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [runByGameId, setRunByGameId] = useState<Record<string, { team: "home" | "visitor"; points: number } | null>>({});

  const getBracket = useAction(api.ncaab.getBracket);
  const getGameRuns = useAction(api.ncaab.getGameRuns);

  const fetchBracket = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBracket({});
      setGames(result.games as NCAABBracketGame[]);
      setCachedAt(result.cachedAt);
    } catch (err: any) {
      console.error("Failed to fetch bracket:", err);
      setError(err.message || "Failed to load bracket");
    } finally {
      setIsLoading(false);
    }
  }, [getBracket]);

  useEffect(() => {
    fetchBracket();
  }, []);

  useEffect(() => {
    const liveGameIds = games
      .filter(
        (g) =>
          g.game_id !== null &&
          g.status !== "Final" &&
          g.status !== "final" &&
          g.status !== "post" &&
          !g.status.includes("T") &&
          g.status !== "scheduled" &&
          g.status !== "pre" &&
          g.status !== ""
      )
      .map((g) => g.game_id as number);

    if (liveGameIds.length === 0) {
      setRunByGameId({});
      return;
    }

    let cancelled = false;
    getGameRuns({ gameIds: liveGameIds })
      .then((result) => {
        if (!cancelled) {
          setRunByGameId(result.runsByGameId as Record<string, { team: "home" | "visitor"; points: number } | null>);
        }
      })
      .catch(() => {
        if (!cancelled) setRunByGameId({});
      });

    return () => {
      cancelled = true;
    };
  }, [games, getGameRuns]);

  // Auto-refresh if any live games
  useEffect(() => {
    const hasLive = games.some(
      (g) =>
        g.status !== "Final" &&
        g.status !== "final" &&
        g.status !== "post" &&
        !g.status.includes("T") &&
        g.status !== "scheduled" &&
        g.status !== "pre" &&
        g.status !== "" &&
        g.home_team.score !== null
    );
    if (!hasLive) return;

    const interval = setInterval(fetchBracket, 60_000);
    return () => clearInterval(interval);
  }, [games, fetchBracket]);

  const bracket = useMemo(() => organizeBracket(games), [games]);

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Nav */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Bracket</h1>
          <div className="flex-1 h-px bg-white/10" />
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
          >
            Home
          </Link>
          <Link
            href="/scores"
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
          >
            Scores
          </Link>
          <Link
            href="/standings?sport=NCAAM"
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
          >
            Standings
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-12 h-12 text-red-500 mb-4"
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
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              onClick={fetchBracket}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-text-secondary">
              No bracket data available yet
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: Full bracket */}
            <div className="hidden lg:block">
              <FullBracket bracket={bracket} runByGameId={runByGameId} />
            </div>

            {/* Mobile: Round-by-round */}
            <div className="lg:hidden">
              <RoundView bracket={bracket} runByGameId={runByGameId} />
            </div>

            {cachedAt && (
              <p className="text-xs text-text-muted text-center mt-6">
                Updated {new Date(cachedAt).toLocaleTimeString()}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
