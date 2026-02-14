"use client";

import { useState, useCallback, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import Image from "next/image";
import type { Player } from "@/lib/types";

type Sport = "NBA" | "NFL" | "MLB";

interface SeasonStats {
  games_played: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
}

interface PlayerWithStats {
  player: Player;
  stats: SeasonStats | null;
  isLoading: boolean;
}

const STAT_LABELS: { key: keyof SeasonStats; label: string; format: (v: number) => string }[] = [
  { key: "pts", label: "PTS", format: (v) => v.toFixed(1) },
  { key: "reb", label: "REB", format: (v) => v.toFixed(1) },
  { key: "ast", label: "AST", format: (v) => v.toFixed(1) },
  { key: "stl", label: "STL", format: (v) => v.toFixed(1) },
  { key: "blk", label: "BLK", format: (v) => v.toFixed(1) },
  { key: "turnover", label: "TOV", format: (v) => v.toFixed(1) },
  { key: "fg_pct", label: "FG%", format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: "fg3_pct", label: "3P%", format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: "ft_pct", label: "FT%", format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: "games_played", label: "GP", format: (v) => v.toString() },
];

function PlayerSearchBox({
  label,
  selectedPlayer,
  onSelect,
  onClear,
}: {
  label: string;
  selectedPlayer: Player | null;
  onSelect: (player: Player) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/players/search?q=${encodeURIComponent(query.trim())}&sport=NBA`
        );
        const data = await res.json();
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  if (selectedPlayer) {
    const initials = selectedPlayer.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="flex-1 bg-card rounded-xl p-4 text-center relative">
        <button
          onClick={onClear}
          className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-full transition-colors"
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex justify-center mb-3">
          {selectedPlayer.photoUrl ? (
            <Image
              src={selectedPlayer.photoUrl}
              alt={selectedPlayer.name}
              width={80}
              height={80}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-accent-purple/50"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent-purple/20 flex items-center justify-center text-xl font-bold text-accent-purple ring-2 ring-accent-purple/50">
              {initials}
            </div>
          )}
        </div>
        <p className="font-bold text-text-primary text-sm">{selectedPlayer.name}</p>
        <p className="text-xs text-text-muted">
          {selectedPlayer.team !== "N/A" ? selectedPlayer.team : ""}{" "}
          {selectedPlayer.position !== "N/A" ? `· ${selectedPlayer.position}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div className="bg-card rounded-xl p-4 text-center">
        <div className="w-16 h-16 rounded-full bg-background-secondary flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-xs text-text-muted mb-3">{label}</p>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search NBA player..."
          className="w-full px-3 py-2 bg-background-secondary rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-accent-purple"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-background-secondary rounded-xl shadow-2xl border border-white/10 z-50 max-h-64 overflow-y-auto">
          {results.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                onSelect(player);
                setQuery("");
                setShowResults(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
            >
              {player.photoUrl ? (
                <Image
                  src={player.photoUrl}
                  alt={player.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent-purple/20 flex items-center justify-center text-xs font-bold text-accent-purple">
                  {player.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-text-primary">{player.name}</p>
                <p className="text-xs text-text-muted">
                  {player.team !== "N/A" ? player.team : ""} {player.position !== "N/A" ? `· ${player.position}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VSPage() {
  const [player1, setPlayer1] = useState<PlayerWithStats | null>(null);
  const [player2, setPlayer2] = useState<PlayerWithStats | null>(null);

  const searchPlayerByName = useAction(api.nba.searchPlayerByName);
  const getPlayerStats = useAction(api.nba.getPlayerStats);

  const fetchPlayerStats = useCallback(
    async (player: Player, setter: (p: PlayerWithStats) => void) => {
      setter({ player, stats: null, isLoading: true });

      try {
        const searchResult = await searchPlayerByName({ name: player.name });
        if (searchResult.playerId) {
          const statsResult = await getPlayerStats({
            playerId: searchResult.playerId,
          });
          setter({
            player,
            stats: statsResult.stats as unknown as SeasonStats | null,
            isLoading: false,
          });
        } else {
          setter({ player, stats: null, isLoading: false });
        }
      } catch {
        setter({ player, stats: null, isLoading: false });
      }
    },
    [searchPlayerByName, getPlayerStats]
  );

  const handleSelectPlayer1 = (player: Player) => {
    fetchPlayerStats(player, setPlayer1);
  };

  const handleSelectPlayer2 = (player: Player) => {
    fetchPlayerStats(player, setPlayer2);
  };

  const bothHaveStats = player1?.stats && player2?.stats;

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">VS Compare</h1>
        <p className="text-sm text-text-secondary mb-6">
          Compare two NBA players head-to-head
        </p>

        {/* Player Selection */}
        <div className="flex gap-3 mb-8 items-start">
          <PlayerSearchBox
            label="Player 1"
            selectedPlayer={player1?.player || null}
            onSelect={handleSelectPlayer1}
            onClear={() => setPlayer1(null)}
          />

          <div className="flex items-center justify-center pt-8">
            <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center">
              <span className="text-sm font-bold text-accent-purple">VS</span>
            </div>
          </div>

          <PlayerSearchBox
            label="Player 2"
            selectedPlayer={player2?.player || null}
            onSelect={handleSelectPlayer2}
            onClear={() => setPlayer2(null)}
          />
        </div>

        {/* Loading State */}
        {(player1?.isLoading || player2?.isLoading) && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Stats Comparison */}
        {bothHaveStats && (
          <div className="bg-card rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center px-4 py-3 bg-background-secondary border-b border-white/5">
              <span className="flex-1 text-sm font-semibold text-text-primary text-center truncate">
                {player1.player.name.split(" ").pop()}
              </span>
              <span className="w-16 text-center text-xs font-medium text-text-muted uppercase">
                Stat
              </span>
              <span className="flex-1 text-sm font-semibold text-text-primary text-center truncate">
                {player2!.player.name.split(" ").pop()}
              </span>
            </div>

            {/* Stat Rows */}
            {STAT_LABELS.map(({ key, label, format }) => {
              const val1 = player1.stats![key] as number;
              const val2 = player2!.stats![key] as number;
              // For turnover, lower is better
              const lowerIsBetter = key === "turnover";
              const p1Better = lowerIsBetter ? val1 < val2 : val1 > val2;
              const p2Better = lowerIsBetter ? val2 < val1 : val2 > val1;
              const tie = val1 === val2;

              return (
                <div
                  key={key}
                  className="flex items-center px-4 py-3 border-b border-white/5 last:border-b-0"
                >
                  <span
                    className={`flex-1 text-center font-semibold tabular-nums ${
                      tie ? "text-text-primary" : p1Better ? "text-green-400" : "text-text-muted"
                    }`}
                  >
                    {format(val1)}
                  </span>
                  <span className="w-16 text-center text-xs font-medium text-text-secondary">
                    {label}
                  </span>
                  <span
                    className={`flex-1 text-center font-semibold tabular-nums ${
                      tie ? "text-text-primary" : p2Better ? "text-green-400" : "text-text-muted"
                    }`}
                  >
                    {format(val2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!player1 && !player2 && (
          <div className="bg-card rounded-2xl p-8 text-center">
            <svg className="w-12 h-12 text-accent-purple/30 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L21 3m0 0h-3.75M21 3v3.75" />
            </svg>
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Pick Two Players
            </h3>
            <p className="text-text-secondary text-sm">
              Search and select two NBA players above to compare their season stats side-by-side.
            </p>
          </div>
        )}

        {/* One player selected, no stats yet */}
        {((player1 && !player1.isLoading && !player2) ||
          (player2 && !player2.isLoading && !player1)) && (
          <div className="bg-card rounded-xl p-6 text-center text-text-muted text-sm">
            Select a second player to start comparing
          </div>
        )}

        {/* Both selected but one has no stats */}
        {player1 &&
          player2 &&
          !player1.isLoading &&
          !player2.isLoading &&
          !bothHaveStats && (
            <div className="bg-card rounded-xl p-6 text-center text-text-muted text-sm">
              {!player1.stats && !player2.stats
                ? "No stats available for either player this season"
                : !player1.stats
                  ? `No stats available for ${player1.player.name} this season`
                  : `No stats available for ${player2.player.name} this season`}
            </div>
          )}
      </div>
    </main>
  );
}
