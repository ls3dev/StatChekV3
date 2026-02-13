"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";

interface Game {
  id: number;
  date: string;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: {
    id: number;
    full_name: string;
    abbreviation: string;
    city: string;
    name: string;
  };
  home_team_score: number;
  visitor_team: {
    id: number;
    full_name: string;
    abbreviation: string;
    city: string;
    name: string;
  };
  visitor_team_score: number;
}

type DateOffset = -1 | 0 | 1;

function formatDate(offset: DateOffset): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(offset: DateOffset): string {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  return "";
}

function ScoreCard({ game }: { game: Game }) {
  const isLive = game.status === "In Progress";
  const isFinal = game.status === "Final";
  const isScheduled = !isLive && !isFinal;

  const homeWinning = game.home_team_score > game.visitor_team_score;
  const visitorWinning = game.visitor_team_score > game.home_team_score;

  const getStatusText = () => {
    if (isLive) return `Q${game.period} ${game.time}`;
    if (isFinal) return "Final";
    return game.status;
  };

  const getStatusColor = () => {
    if (isLive) return "text-red-500";
    if (isFinal) return "text-text-muted";
    return "text-text-secondary";
  };

  return (
    <div className="bg-card rounded-xl p-4 mb-2 relative hover:bg-card-hover transition-colors">
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-500">LIVE</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {game.postseason && (
          <span className="bg-accent-purple px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
            PLAYOFFS
          </span>
        )}
      </div>

      <div className="space-y-1">
        {/* Visitor Team */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p
              className={`font-semibold ${
                isFinal && visitorWinning
                  ? "text-text-primary font-bold"
                  : "text-text-primary"
              }`}
            >
              {game.visitor_team.abbreviation}
            </p>
            <p className="text-xs text-text-secondary">
              {game.visitor_team.city}
            </p>
          </div>
          {!isScheduled && (
            <span
              className={`text-xl font-bold tabular-nums ${
                isFinal && visitorWinning
                  ? "text-text-primary"
                  : isFinal
                    ? "text-text-muted"
                    : "text-text-primary"
              }`}
            >
              {game.visitor_team_score}
            </span>
          )}
        </div>

        <div className="border-t border-white/5" />

        {/* Home Team */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p
              className={`font-semibold ${
                isFinal && homeWinning
                  ? "text-text-primary font-bold"
                  : "text-text-primary"
              }`}
            >
              {game.home_team.abbreviation}
            </p>
            <p className="text-xs text-text-secondary">
              {game.home_team.city}
            </p>
          </div>
          {!isScheduled && (
            <span
              className={`text-xl font-bold tabular-nums ${
                isFinal && homeWinning
                  ? "text-text-primary"
                  : isFinal
                    ? "text-text-muted"
                    : "text-text-primary"
              }`}
            >
              {game.home_team_score}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ScoresPage() {
  const [selectedDate, setSelectedDate] = useState<DateOffset>(0);
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const getGames = useAction(api.nba.getGames);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const date = formatDate(selectedDate);
      const result = await getGames({ date });
      setGames(result.games as Game[]);
      setCachedAt(result.cachedAt);
    } catch (err: any) {
      console.error("Failed to fetch games:", err);
      setError(err.message || "Failed to load games");
    } finally {
      setIsLoading(false);
    }
  }, [getGames, selectedDate]);

  useEffect(() => {
    fetchGames();
  }, [selectedDate]);

  const { liveGames, completedGames, scheduledGames } = useMemo(() => {
    const live: Game[] = [];
    const completed: Game[] = [];
    const scheduled: Game[] = [];

    games.forEach((game) => {
      if (game.status === "In Progress") {
        live.push(game);
      } else if (game.status === "Final") {
        completed.push(game);
      } else {
        scheduled.push(game);
      }
    });

    return {
      liveGames: live,
      completedGames: completed,
      scheduledGames: scheduled,
    };
  }, [games]);

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Scores</h1>

        {/* Date Selector */}
        <div className="flex gap-2 mb-6">
          {([-1, 0, 1] as DateOffset[]).map((offset) => (
            <button
              key={offset}
              onClick={() => setSelectedDate(offset)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDate === offset
                  ? "bg-accent-purple text-white"
                  : "bg-background-secondary text-text-secondary hover:text-text-primary"
              }`}
            >
              {formatDisplayDate(offset)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
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
              onClick={fetchGames}
              className="px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:bg-purple-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
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
                d="M20 12H4"
              />
            </svg>
            <p className="text-text-secondary">
              No games {formatDisplayDate(selectedDate).toLowerCase()}
            </p>
          </div>
        ) : (
          <div>
            {/* Live Games */}
            {liveGames.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded w-fit mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-500">LIVE</span>
                </div>
                {liveGames.map((game) => (
                  <ScoreCard key={game.id} game={game} />
                ))}
              </div>
            )}

            {/* Scheduled Games */}
            {scheduledGames.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                  Upcoming
                </p>
                {scheduledGames.map((game) => (
                  <ScoreCard key={game.id} game={game} />
                ))}
              </div>
            )}

            {/* Completed Games */}
            {completedGames.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                  Final
                </p>
                {completedGames.map((game) => (
                  <ScoreCard key={game.id} game={game} />
                ))}
              </div>
            )}

            {/* Cache info */}
            {cachedAt && (
              <p className="text-xs text-text-muted text-center mt-4">
                Updated {new Date(cachedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
