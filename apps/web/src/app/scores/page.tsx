"use client";

import { Suspense, useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";
import { getNCAABTeamLogoUrl } from "@/lib/ncaabTeamLogos";
import { GameDetailModal } from "@/components/GameDetailModal";
import { PlayerModal } from "@/components/PlayerModal";
import { NCAABGameDetailModal } from "@/components/bracket/NCAABGameDetailModal";
import type { Player } from "@/lib/types";
import {
  type NCAABBracketGame,
  type NCAABScoreGame,
  type NCAABStanding,
} from "@convex/lib/ncaabBracket";

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

type Sport = "NBA" | "NCAAM" | "NFL" | "MLB";
type DateOffset = -1 | 0 | 1;

function formatDate(offset: DateOffset): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(offset: DateOffset): string {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  return "";
}

function formatLongDate(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRelativeDateLabel(dateString: string): string | null {
  if (dateString === formatDate(0)) return "Today";
  if (dateString === formatDate(-1)) return "Yesterday";
  if (dateString === formatDate(1)) return "Tomorrow";
  return null;
}

function shiftDate(dateString: string, days: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return formatDate(0);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ScoreCard({
  game,
  onClick,
}: {
  game: Game;
  onClick: () => void;
}) {
  // Game status can be: "Final", "1st Qtr", "2nd Qtr", "3rd Qtr", "4th Qtr", "Halftime", or a datetime string for scheduled
  const isFinal = game.status === "Final";
  const isScheduled = !isFinal && (game.status.includes("T") || game.period === 0);
  const isLive = !isFinal && !isScheduled;

  const homeWinning = game.home_team_score > game.visitor_team_score;
  const visitorWinning = game.visitor_team_score > game.home_team_score;

  const getStatusText = () => {
    if (isFinal) return "Final";
    if (isLive) {
      // Use time if available, otherwise use status (e.g., "4th Qtr")
      return game.time || game.status;
    }
    // Scheduled - parse datetime to show local time
    try {
      const date = new Date(game.status);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      }
    } catch {
      // fallthrough
    }
    return game.status;
  };

  const getStatusColor = () => {
    if (isLive) return "text-red-500";
    if (isFinal) return "text-text-muted";
    return "text-text-secondary";
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-xl p-4 mb-2 relative hover:bg-card-hover transition-colors text-left cursor-pointer"
    >
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
          <span className="bg-accent px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
            PLAYOFFS
          </span>
        )}
      </div>

      <div className="space-y-1">
        {/* Visitor Team */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Image
              src={getNBATeamLogoUrl(game.visitor_team.abbreviation)}
              alt={game.visitor_team.abbreviation}
              width={24}
              height={24}
              className="w-6 h-6"
            />
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
          <div className="flex items-center gap-2">
            <Image
              src={getNBATeamLogoUrl(game.home_team.abbreviation)}
              alt={game.home_team.abbreviation}
              width={24}
              height={24}
              className="w-6 h-6"
            />
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
    </button>
  );
}

function NCAAMScoreCard({
  game,
  onClick,
}: {
  game: NCAABScoreGame;
  onClick: () => void;
}) {
  const isFinal =
    game.status === "Final" || game.status === "final" || game.status === "post";
  const isScheduled =
    !isFinal &&
    (game.status.includes("T") ||
      game.status === "scheduled" ||
      game.status === "pre" ||
      game.status === "");
  const isLive = !isFinal && !isScheduled;

  const homeScore = game.home_team.score ?? 0;
  const awayScore = game.away_team.score ?? 0;
  const homeWinning = homeScore > awayScore;
  const awayWinning = awayScore > homeScore;

  const getStatusText = () => {
    if (isFinal) return "Final";
    if (isLive) return game.status || "LIVE";
    try {
      const date = new Date(game.date ?? "");
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
      }
    } catch {}
    return game.status || "Scheduled";
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-xl p-4 mb-2 relative hover:bg-card-hover transition-colors text-left cursor-pointer"
    >
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-500">LIVE</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs font-medium ${isLive ? "text-red-500" : isFinal ? "text-text-muted" : "text-text-secondary"}`}>
          {getStatusText()}
        </span>
        {game.postseason && (
          <span className="bg-accent px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
            POSTSEASON
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            {(() => {
              const logo = game.away_team.abbreviation
                ? getNCAABTeamLogoUrl(game.away_team.abbreviation)
                : null;
              return logo ? (
                <Image
                  src={logo}
                  alt={game.away_team.abbreviation || "Away"}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-accent/20" />
              );
            })()}
            <div>
              <p className={`font-semibold ${isFinal && awayWinning ? "text-text-primary font-bold" : "text-text-primary"}`}>
                {game.away_team.abbreviation || game.away_team.name || "AWAY"}
              </p>
              <p className="text-xs text-text-secondary">
                {game.away_team.full_name || game.away_team.name || ""}
              </p>
            </div>
          </div>
          {!isScheduled && (
            <span className={`text-xl font-bold tabular-nums ${isFinal && awayWinning ? "text-text-primary" : isFinal ? "text-text-muted" : "text-text-primary"}`}>
              {awayScore}
            </span>
          )}
        </div>

        <div className="border-t border-white/5" />

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            {(() => {
              const logo = game.home_team.abbreviation
                ? getNCAABTeamLogoUrl(game.home_team.abbreviation)
                : null;
              return logo ? (
                <Image
                  src={logo}
                  alt={game.home_team.abbreviation || "Home"}
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-accent/20" />
              );
            })()}
            <div>
              <p className={`font-semibold ${isFinal && homeWinning ? "text-text-primary font-bold" : "text-text-primary"}`}>
                {game.home_team.abbreviation || game.home_team.name || "HOME"}
              </p>
              <p className="text-xs text-text-secondary">
                {game.home_team.full_name || game.home_team.name || ""}
              </p>
            </div>
          </div>
          {!isScheduled && (
            <span className={`text-xl font-bold tabular-nums ${isFinal && homeWinning ? "text-text-primary" : isFinal ? "text-text-muted" : "text-text-primary"}`}>
              {homeScore}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function toBracketGame(game: NCAABScoreGame): NCAABBracketGame {
  return {
    game_id: game.id,
    season: game.season,
    round: 0,
    region_id: null,
    region_label: null,
    bracket_location: null,
    date: game.date,
    location: null,
    status: game.status,
    status_detail: null,
    broadcasts: null,
    home_team: {
      id: game.home_team.id,
      name: game.home_team.name,
      full_name: game.home_team.full_name,
      abbreviation: game.home_team.abbreviation,
      seed: null,
      score: game.home_team.score,
      winner:
        game.home_team.score != null && game.away_team.score != null
          ? game.home_team.score > game.away_team.score
          : null,
    },
    away_team: {
      id: game.away_team.id,
      name: game.away_team.name,
      full_name: game.away_team.full_name,
      abbreviation: game.away_team.abbreviation,
      seed: null,
      score: game.away_team.score,
      winner:
        game.home_team.score != null && game.away_team.score != null
          ? game.away_team.score > game.home_team.score
          : null,
    },
  };
}

function ComingSoonSport({ sport }: { sport: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        {sport === "NFL" ? (
          <svg className="w-9 h-9 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
            <line x1="12" y1="8.5" x2="12" y2="15.5" />
            <line x1="10.5" y1="10" x2="13.5" y2="10" />
            <line x1="10.5" y1="12" x2="13.5" y2="12" />
            <line x1="10.5" y1="14" x2="13.5" y2="14" />
          </svg>
        ) : (
          <svg className="w-9 h-9 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M5.5 7.5c1.5 1.5 1.5 3.5 0 5s-1.5 3.5 0 5" />
            <path d="M18.5 6.5c-1.5 1.5-1.5 3.5 0 5s1.5 3.5 0 5" />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">{sport} Scores</h3>
      <p className="text-text-secondary mb-1">Coming Soon</p>
      <p className="text-sm text-text-muted max-w-xs">
        {sport} scores and live game updates are on the way. Stay tuned!
      </p>
    </div>
  );
}

export default function ScoresPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background-primary flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ScoresContent />
    </Suspense>
  );
}

function ScoresContent() {
  const searchParams = useSearchParams();
  const sportParam = searchParams.get("sport");
  const initialSport: Sport =
    sportParam === "NBA" || sportParam === "NCAAM" || sportParam === "NFL" || sportParam === "MLB"
      ? sportParam
      : "NCAAM";
  const [selectedSport, setSelectedSport] = useState<Sport>(initialSport);
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(0));
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  // Game detail modal
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameDetail, setShowGameDetail] = useState(false);

  // Player modal (opened from box score)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  // NCAAM scores state
  const [ncaamGames, setNcaamGames] = useState<NCAABScoreGame[]>([]);
  const [ncaamStandings, setNcaamStandings] = useState<NCAABStanding[]>([]);
  const [ncaamLoading, setNcaamLoading] = useState(false);
  const [ncaamError, setNcaamError] = useState<string | null>(null);
  const [ncaamCachedAt, setNcaamCachedAt] = useState<number | null>(null);
  const [selectedNcaamConference, setSelectedNcaamConference] = useState("All");
  const [selectedNcaamGame, setSelectedNcaamGame] = useState<NCAABBracketGame | null>(null);
  const [showNcaamGameDetail, setShowNcaamGameDetail] = useState(false);

  const getGames = useAction(api.nba.getGames);
  const getNcaamGames = useAction(api.ncaab.getGames);
  const getNcaamStandings = useAction(api.ncaab.getStandings);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getGames({ date: selectedDate });
      setGames(result.games as Game[]);
      setCachedAt(result.cachedAt);
    } catch (err: any) {
      console.error("Failed to fetch games:", err);
      setError(err.message || "Failed to load games");
    } finally {
      setIsLoading(false);
    }
  }, [getGames, selectedDate]);

  const fetchNcaamScores = useCallback(async () => {
    setNcaamLoading(true);
    setNcaamError(null);
    try {
      const [gamesResult, standingsResult] = await Promise.all([
        getNcaamGames({ date: selectedDate }),
        getNcaamStandings({}),
      ]);
      setNcaamGames(gamesResult.games as NCAABScoreGame[]);
      setNcaamStandings(standingsResult.standings as NCAABStanding[]);
      setNcaamCachedAt(Math.max(gamesResult.cachedAt, standingsResult.cachedAt));
    } catch (err: any) {
      console.error("Failed to fetch NCAAM scores:", err);
      setNcaamError(err.message || "Failed to load NCAAM scores");
    } finally {
      setNcaamLoading(false);
    }
  }, [getNcaamGames, getNcaamStandings, selectedDate]);

  useEffect(() => {
    if (selectedSport === "NBA") {
      fetchGames();
    }
    if (selectedSport === "NCAAM") {
      fetchNcaamScores();
    }
  }, [selectedDate, selectedSport, fetchGames, fetchNcaamScores]);

  // Auto-refresh for live games
  useEffect(() => {
    if (selectedSport !== "NBA") return;

    const hasLiveGames = games.some((g) => g.status !== "Final" && !g.status.includes("T") && g.period > 0);
    if (!hasLiveGames) return;

    const interval = setInterval(() => {
      fetchGames();
    }, 30_000);

    return () => clearInterval(interval);
  }, [games, selectedSport, fetchGames]);

  useEffect(() => {
    if (selectedSport !== "NCAAM") return;
    const hasLiveGames = ncaamGames.some((g) => {
      const status = g.status ?? "";
      return (
        status !== "Final" &&
        status !== "final" &&
        status !== "post" &&
        !status.includes("T") &&
        status !== "scheduled" &&
        status !== "pre" &&
        status !== "" &&
        g.home_team.score !== null
      );
    });
    if (!hasLiveGames) return;
    const interval = setInterval(() => {
      fetchNcaamScores();
    }, 30_000);
    return () => clearInterval(interval);
  }, [ncaamGames, selectedSport, fetchNcaamScores]);

  const { liveGames, completedGames, scheduledGames } = useMemo(() => {
    const live: Game[] = [];
    const completed: Game[] = [];
    const scheduled: Game[] = [];

    games.forEach((game) => {
      const isFinal = game.status === "Final";
      const isScheduled = !isFinal && (game.status.includes("T") || game.period === 0);
      if (isFinal) {
        completed.push(game);
      } else if (isScheduled) {
        scheduled.push(game);
      } else {
        live.push(game);
      }
    });

    return {
      liveGames: live,
      completedGames: completed,
      scheduledGames: scheduled,
    };
  }, [games]);

  const ncaamTeamConferenceMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const standing of ncaamStandings) {
      const confName =
        standing.conference?.short_name ||
        standing.conference?.name ||
        "Unknown";
      if (standing.team?.id != null) {
        map.set(standing.team.id, confName);
      }
    }
    return map;
  }, [ncaamStandings]);

  const ncaamConferences = useMemo(() => {
    const names = new Set<string>();
    for (const game of ncaamGames) {
      const homeConf = game.home_team.id != null ? ncaamTeamConferenceMap.get(game.home_team.id) : null;
      const awayConf = game.away_team.id != null ? ncaamTeamConferenceMap.get(game.away_team.id) : null;
      if (homeConf) names.add(homeConf);
      if (awayConf) names.add(awayConf);
    }
    return ["All", ...Array.from(names).sort((a, b) => a.localeCompare(b))];
  }, [ncaamGames, ncaamTeamConferenceMap]);

  useEffect(() => {
    if (!ncaamConferences.includes(selectedNcaamConference)) {
      setSelectedNcaamConference("All");
    }
  }, [ncaamConferences, selectedNcaamConference]);

  const filteredNcaamGames = useMemo(() => {
    if (selectedNcaamConference === "All") return ncaamGames;
    return ncaamGames.filter((game) => {
      const homeConf = game.home_team.id != null ? ncaamTeamConferenceMap.get(game.home_team.id) : null;
      const awayConf = game.away_team.id != null ? ncaamTeamConferenceMap.get(game.away_team.id) : null;
      return homeConf === selectedNcaamConference || awayConf === selectedNcaamConference;
    });
  }, [ncaamGames, ncaamTeamConferenceMap, selectedNcaamConference]);

  const { ncaamLiveGames, ncaamCompletedGames, ncaamScheduledGames } = useMemo(() => {
    const live: NCAABScoreGame[] = [];
    const completed: NCAABScoreGame[] = [];
    const scheduled: NCAABScoreGame[] = [];

    filteredNcaamGames.forEach((game) => {
      const status = game.status ?? "";
      const isFinal = status === "Final" || status === "final" || status === "post";
      const isScheduled =
        !isFinal &&
        (status.includes("T") || status === "scheduled" || status === "pre" || status === "");
      if (isFinal) completed.push(game);
      else if (isScheduled) scheduled.push(game);
      else live.push(game);
    });

    return {
      ncaamLiveGames: live,
      ncaamCompletedGames: completed,
      ncaamScheduledGames: scheduled,
    };
  }, [filteredNcaamGames]);

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    setShowGameDetail(true);
  };

  const handlePlayerClick = async (playerName: string, teamAbbr?: string) => {
    // Try to find full player data from the search API
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(playerName)}&sport=NBA`);
      const results: Player[] = await res.json();
      const normalizedName = playerName.trim().toLowerCase();
      const normalizedTeam = teamAbbr?.trim().toLowerCase();
      const bestMatch =
        results.find(
          (player) =>
            player.name.trim().toLowerCase() === normalizedName &&
            (!!normalizedTeam ? player.team.trim().toLowerCase() === normalizedTeam : true)
        ) ??
        results.find((player) => player.name.trim().toLowerCase() === normalizedName) ??
        results[0];

      if (bestMatch) {
        setSelectedPlayer(bestMatch);
        setShowPlayerModal(true);
        setShowGameDetail(false);
        return;
      }
    } catch {
      // Fall through to minimal player
    }
    // Fallback: create a minimal player object
    const player: Player = {
      id: playerName.toLowerCase().replace(/\s+/g, "-"),
      name: playerName,
      sport: "NBA",
      team: "N/A",
      position: "N/A",
      number: "",
    };
    setSelectedPlayer(player);
    setShowPlayerModal(true);
    setShowGameDetail(false);
  };

  return (
    <main className="min-h-screen bg-background-primary">
      <div className={`${selectedSport === "NCAAM" ? "max-w-7xl" : "max-w-3xl"} mx-auto px-4 md:px-6 py-8`}>
        {/* Nav buttons */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Scores</h1>
          <div className="flex-1 h-px bg-white/10" />
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
          >
            Home
          </Link>
          <Link
            href={`/standings${selectedSport !== "NBA" ? `?sport=${selectedSport}` : ""}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
          >
            Standings
          </Link>
        </div>

        {/* Sport Tabs */}
        <div className="flex gap-1 p-1 bg-background-secondary rounded-xl mb-6">
          {(["NBA", "NCAAM", "NFL", "MLB"] as Sport[]).map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                selectedSport === sport
                  ? "bg-accent text-white shadow-lg shadow-green-500/20"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {sport}
              {sport !== "NBA" && sport !== "NCAAM" && (
                <span className={`ml-1.5 text-[10px] font-medium uppercase ${
                  selectedSport === sport ? "text-white/70" : "text-text-muted"
                }`}>
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* NCAAM Scores */}
        {selectedSport === "NCAAM" ? (
          <>
            <div className="bg-background-secondary rounded-xl p-3 mb-6">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setSelectedDate((current) => shiftDate(current, -1))}
                  className="px-3 py-2 rounded-lg bg-black/20 text-text-primary hover:bg-black/30 transition-colors"
                >
                  Prev
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-card border border-white/10 text-text-primary outline-none"
                />
                <button
                  onClick={() => setSelectedDate((current) => shiftDate(current, 1))}
                  className="px-3 py-2 rounded-lg bg-black/20 text-text-primary hover:bg-black/30 transition-colors"
                >
                  Next
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                {([-1, 0, 1] as DateOffset[]).map((offset) => {
                  const quickDate = formatDate(offset);
                  return (
                    <button
                      key={offset}
                      onClick={() => setSelectedDate(quickDate)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDate === quickDate
                          ? "bg-accent text-white"
                          : "bg-black/20 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {formatDisplayDate(offset)}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-text-secondary text-center">
                {getRelativeDateLabel(selectedDate) ?? "Selected Date"}: {formatLongDate(selectedDate)}
              </p>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-text-primary">NCAAM Scores</h2>
              <div className="flex-1 h-px bg-white/10" />
              <Link
                href="/bracket"
                className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
              >
                Bracket
              </Link>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {ncaamConferences.map((conference) => (
                <button
                  key={conference}
                  onClick={() => setSelectedNcaamConference(conference)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedNcaamConference === conference
                      ? "bg-accent text-white"
                      : "bg-background-secondary text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {conference}
                </button>
              ))}
            </div>

            {ncaamLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
            ) : ncaamError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-text-secondary mb-4">{ncaamError}</p>
              <button
                onClick={fetchNcaamScores}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
              >
                Try Again
              </button>
            </div>
            ) : filteredNcaamGames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-text-secondary">
                No NCAAM games for {selectedNcaamConference === "All" ? formatLongDate(selectedDate) : `${selectedNcaamConference} on ${formatLongDate(selectedDate)}`}
              </p>
            </div>
          ) : (
              <div>
                {ncaamLiveGames.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded w-fit mb-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-red-500">LIVE</span>
                    </div>
                    {ncaamLiveGames.map((game) => (
                      <NCAAMScoreCard
                        key={game.id}
                        game={game}
                        onClick={() => {
                          setSelectedNcaamGame(toBracketGame(game));
                          setShowNcaamGameDetail(true);
                        }}
                      />
                    ))}
                  </div>
                )}

                {ncaamScheduledGames.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                      Upcoming
                    </p>
                    {ncaamScheduledGames.map((game) => (
                      <NCAAMScoreCard
                        key={game.id}
                        game={game}
                        onClick={() => {
                          setSelectedNcaamGame(toBracketGame(game));
                          setShowNcaamGameDetail(true);
                        }}
                      />
                    ))}
                  </div>
                )}

                {ncaamCompletedGames.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                      Final
                    </p>
                    {ncaamCompletedGames.map((game) => (
                      <NCAAMScoreCard
                        key={game.id}
                        game={game}
                        onClick={() => {
                          setSelectedNcaamGame(toBracketGame(game));
                          setShowNcaamGameDetail(true);
                        }}
                      />
                    ))}
                  </div>
                )}

                {ncaamCachedAt && (
                  <p className="text-xs text-text-muted text-center mt-4">
                    Updated {new Date(ncaamCachedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            )}
          </>
        ) : selectedSport === "NFL" || selectedSport === "MLB" ? (
          <ComingSoonSport sport={selectedSport} />
        ) : (
          <>
            {/* Date Selector */}
            <div className="bg-background-secondary rounded-xl p-3 mb-6">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setSelectedDate((current) => shiftDate(current, -1))}
                  className="px-3 py-2 rounded-lg bg-black/20 text-text-primary hover:bg-black/30 transition-colors"
                >
                  Prev
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-card border border-white/10 text-text-primary outline-none"
                />
                <button
                  onClick={() => setSelectedDate((current) => shiftDate(current, 1))}
                  className="px-3 py-2 rounded-lg bg-black/20 text-text-primary hover:bg-black/30 transition-colors"
                >
                  Next
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                {([-1, 0, 1] as DateOffset[]).map((offset) => {
                  const quickDate = formatDate(offset);
                  return (
                    <button
                      key={offset}
                      onClick={() => setSelectedDate(quickDate)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDate === quickDate
                          ? "bg-accent text-white"
                          : "bg-black/20 text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {formatDisplayDate(offset)}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-text-secondary text-center">
                {getRelativeDateLabel(selectedDate) ?? "Selected Date"}: {formatLongDate(selectedDate)}
              </p>
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
                  onClick={fetchGames}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
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
                  No games for {formatLongDate(selectedDate)}
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
                      <ScoreCard
                        key={game.id}
                        game={game}
                        onClick={() => handleGameClick(game)}
                      />
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
                      <ScoreCard
                        key={game.id}
                        game={game}
                        onClick={() => handleGameClick(game)}
                      />
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
                      <ScoreCard
                        key={game.id}
                        game={game}
                        onClick={() => handleGameClick(game)}
                      />
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
          </>
        )}
      </div>

      {/* Game Detail Modal */}
      <GameDetailModal
        game={selectedGame}
        isOpen={showGameDetail}
        onClose={() => setShowGameDetail(false)}
        onPlayerClick={handlePlayerClick}
      />

      {/* Player Modal (from box score click) */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
      />

      <NCAABGameDetailModal
        game={selectedNcaamGame}
        isOpen={showNcaamGameDetail}
        onClose={() => setShowNcaamGameDetail(false)}
      />
    </main>
  );
}
