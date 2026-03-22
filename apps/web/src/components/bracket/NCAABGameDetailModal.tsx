"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { getNCAABTeamLogoUrl } from "@/lib/ncaabTeamLogos";
import { PlayerModal } from "@/components/PlayerModal";
import type { Player } from "@/lib/types";
import type {
  NCAABBracketGame,
  NCAABGameDetail,
  NCAABPlay,
  NCAABPlayerStat,
  NCAABTeamSeasonStats,
} from "@convex/lib/ncaabBracket";

interface NCAABGameDetailModalProps {
  game: NCAABBracketGame | null;
  isOpen: boolean;
  onClose: () => void;
}

const STAT_COLUMNS = [
  { key: "min", label: "MIN" },
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "fg", label: "FG" },
  { key: "3p", label: "3P" },
  { key: "ft", label: "FT" },
] as const;

function formatMin(min: string) {
  if (!min || min === "00" || min === "0" || min === "00:00") return "-";
  return min.split(":")[0];
}

function normalizeStatValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return value;
}

function formatPct(made: number | null | undefined, attempted: number | null | undefined) {
  const safeMade = normalizeStatValue(made);
  const safeAttempted = normalizeStatValue(attempted);
  if (safeMade === null || safeAttempted === null || safeAttempted <= 0) return "-";
  return ((safeMade / safeAttempted) * 100).toFixed(1) + "%";
}

function formatStatNumber(value: number | null | undefined) {
  const normalized = normalizeStatValue(value);
  if (normalized === null) return "-";
  return String(normalized);
}

function formatAverage(value: number | null | undefined) {
  const normalized = normalizeStatValue(value);
  if (normalized === null) return "-";
  return normalized.toFixed(1);
}

function formatMadeAttempt(made: number | null | undefined, attempted: number | null | undefined) {
  const safeMade = formatStatNumber(made);
  const safeAttempted = formatStatNumber(attempted);
  if (safeMade === "-" && safeAttempted === "-") return "-";
  return `${safeMade}-${safeAttempted}`;
}

function formatStoredPct(value: number | null | undefined, made?: number | null, attempted?: number | null) {
  const normalized = normalizeStatValue(value);
  if (normalized !== null) {
    const pct = normalized > 1 ? normalized : normalized * 100;
    return `${pct.toFixed(1)}%`;
  }
  return formatPct(made, attempted);
}

function cleanPlayerPosition(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  if (
    !normalized ||
    normalized === "N/A" ||
    normalized === "null" ||
    normalized === "-1" ||
    normalized === "null-1"
  ) {
    return null;
  }
  return normalized;
}

function cleanJerseyNumber(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized || normalized === "-1" || normalized === "0" || normalized === "null") {
    return null;
  }
  return normalized;
}

function computeTeamTotals(players: NCAABPlayerStat[]) {
  return players.reduce(
    (acc, p) => ({
      pts: acc.pts + (p.pts || 0),
      reb: acc.reb + (p.reb || 0),
      ast: acc.ast + (p.ast || 0),
      stl: acc.stl + (p.stl || 0),
      blk: acc.blk + (p.blk || 0),
      turnover: acc.turnover + (p.turnover || 0),
      fgm: acc.fgm + (p.fgm || 0),
      fga: acc.fga + (p.fga || 0),
      fg3m: acc.fg3m + (p.fg3m || 0),
      fg3a: acc.fg3a + (p.fg3a || 0),
      ftm: acc.ftm + (p.ftm || 0),
      fta: acc.fta + (p.fta || 0),
    }),
    {
      pts: 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      turnover: 0,
      fgm: 0,
      fga: 0,
      fg3m: 0,
      fg3a: 0,
      ftm: 0,
      fta: 0,
    }
  );
}

// ---- Half Scores ----
function HalfScores({
  bracketGame,
  gameDetail,
  currentRun,
}: {
  bracketGame: NCAABBracketGame;
  gameDetail: NCAABGameDetail;
  currentRun: { team: "home" | "visitor"; points: number } | null;
}) {
  const halves: { label: string; home: number; visitor: number }[] = [
    { label: "H1", home: gameDetail.home_score_h1, visitor: gameDetail.away_score_h1 },
    { label: "H2", home: gameDetail.home_score_h2, visitor: gameDetail.away_score_h2 },
  ];

  if (gameDetail.home_ot_scores) {
    gameDetail.home_ot_scores.forEach((score, i) => {
      halves.push({
        label: `OT${i + 1}`,
        home: score,
        visitor: gameDetail.away_ot_scores?.[i] ?? 0,
      });
    });
  }

  const homeAbbr = bracketGame.home_team.abbreviation || bracketGame.home_team.name || "HOME";
  const awayAbbr = bracketGame.away_team.abbreviation || bracketGame.away_team.name || "AWAY";
  const getRunText = (side: "home" | "visitor") => {
    if (!currentRun) return null;
    if (currentRun.team === side) return { text: `${currentRun.points}-0`, hot: true };
    return { text: `0-${currentRun.points}`, hot: false };
  };
  const awayRun = getRunText("visitor");
  const homeRun = getRunText("home");

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <div
        className="grid items-center text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-white/5 py-2"
        style={{ gridTemplateColumns: `60px repeat(${halves.length}, 1fr) 50px 70px` }}
      >
        <div />
        {halves.map((h) => (
          <div key={h.label}>{h.label}</div>
        ))}
        <div>T</div>
        <div>RUN</div>
      </div>
      {/* Away row */}
      <div
        className="grid items-center text-center py-2 border-b border-white/5"
        style={{ gridTemplateColumns: `60px repeat(${halves.length}, 1fr) 50px 70px` }}
      >
        <div className="text-xs font-semibold text-text-primary pl-3 text-left truncate">
          {awayAbbr}
        </div>
        {halves.map((h) => (
          <div key={h.label} className="text-xs text-text-secondary tabular-nums">
            {h.visitor}
          </div>
        ))}
        <div className="text-xs font-bold text-text-primary tabular-nums">
          {gameDetail.away_score}
        </div>
        <div className="flex justify-center">
          {awayRun && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${awayRun.hot ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
              {awayRun.hot ? "🔥" : "🥶"} {awayRun.text}
            </span>
          )}
        </div>
      </div>
      {/* Home row */}
      <div
        className="grid items-center text-center py-2"
        style={{ gridTemplateColumns: `60px repeat(${halves.length}, 1fr) 50px 70px` }}
      >
        <div className="text-xs font-semibold text-text-primary pl-3 text-left truncate">
          {homeAbbr}
        </div>
        {halves.map((h) => (
          <div key={h.label} className="text-xs text-text-secondary tabular-nums">
            {h.home}
          </div>
        ))}
        <div className="text-xs font-bold text-text-primary tabular-nums">
          {gameDetail.home_score}
        </div>
        <div className="flex justify-center">
          {homeRun && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${homeRun.hot ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
              {homeRun.hot ? "🔥" : "🥶"} {homeRun.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Team Stats Card ----
function TeamStatsCard({
  players,
  teamLabel,
  teamAbbreviation,
}: {
  players: NCAABPlayerStat[];
  teamLabel: string;
  teamAbbreviation: string | null;
}) {
  const totals = computeTeamTotals(players);
  const statCards = [
    { label: "PTS", value: formatStatNumber(totals.pts) },
    { label: "REB", value: formatStatNumber(totals.reb) },
    { label: "AST", value: formatStatNumber(totals.ast) },
    { label: "FG%", value: formatPct(totals.fgm, totals.fga) },
    { label: "3PT%", value: formatPct(totals.fg3m, totals.fg3a) },
    { label: "FT%", value: formatPct(totals.ftm, totals.fta) },
    { label: "STL", value: formatStatNumber(totals.stl) },
    { label: "BLK", value: formatStatNumber(totals.blk) },
    { label: "TO", value: formatStatNumber(totals.turnover) },
  ];

  return (
    <div className="bg-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-text-primary">Game Team Stats</p>
          <p className="text-[10px] text-text-muted">Totals from this matchup</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
          {(() => {
            const logo = getNCAABTeamLogoUrl(teamAbbreviation);
            return logo ? (
              <Image src={logo} alt={teamLabel} width={16} height={16} className="w-4 h-4 object-contain" />
            ) : null;
          })()}
          <span className="text-xs font-semibold text-text-primary">{teamLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-text-primary tabular-nums">{stat.value}</p>
            <p className="text-[10px] text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Season Stats Card (pre-game) ----
function SeasonStatsCard({
  stats,
  teamLabel,
  teamAbbreviation,
}: {
  stats: NCAABTeamSeasonStats;
  teamLabel: string;
  teamAbbreviation: string | null;
}) {
  const fgPct = formatStoredPct(stats.fg_pct, stats.fgm, stats.fga);
  const fg3Pct = formatStoredPct(stats.fg3_pct, stats.fg3m, stats.fg3a);
  const ftPct = formatStoredPct(stats.ft_pct, stats.ftm, stats.fta);

  const statCards = [
    { label: "PPG", value: formatAverage(stats.pts) },
    { label: "RPG", value: formatAverage(stats.reb) },
    { label: "APG", value: formatAverage(stats.ast) },
    { label: "FG%", value: fgPct },
    { label: "3PT%", value: fg3Pct },
    { label: "FT%", value: ftPct },
    { label: "STL", value: formatAverage(stats.stl) },
    { label: "BLK", value: formatAverage(stats.blk) },
    { label: "TO", value: formatAverage(stats.turnover) },
  ];

  return (
    <div className="bg-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-text-primary">Season Team Stats</p>
          <p className="text-[10px] text-text-muted">{stats.games ?? 0} games played</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
          {(() => {
            const logo = getNCAABTeamLogoUrl(teamAbbreviation);
            return logo ? (
              <Image src={logo} alt={teamLabel} width={16} height={16} className="w-4 h-4 object-contain" />
            ) : null;
          })()}
          <span className="text-xs font-semibold text-text-primary">{teamLabel}</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-text-primary tabular-nums">{stat.value}</p>
            <p className="text-[10px] text-text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Box Score Table ----
function BoxScoreTable({
  players,
  onPlayerSelect,
}: {
  players: NCAABPlayerStat[];
  onPlayerSelect: (player: NCAABPlayerStat) => void;
}) {
  const activePlayers = players
    .filter((p) => p.min && p.min !== "00" && p.min !== "0" && p.min !== "00:00")
    .sort(
      (a, b) =>
        parseInt(b.min?.split(":")[0] ?? "0") - parseInt(a.min?.split(":")[0] ?? "0")
    );

  const inactivePlayers = players.filter(
    (p) => !p.min || p.min === "00" || p.min === "0" || p.min === "00:00"
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 px-2 text-text-muted font-semibold sticky left-0 bg-card min-w-[120px]">
              PLAYER
            </th>
            {STAT_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="text-center py-2 px-1.5 text-text-muted font-semibold min-w-[40px]"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activePlayers.map((p) => {
            const playerPosition = cleanPlayerPosition(p.player.position);
            return (
            <tr
              key={p.player.id}
              className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => onPlayerSelect(p)}
            >
              <td className="py-2 px-2 sticky left-0 bg-card">
                <div className="flex items-center gap-1.5">
                  <span className="text-text-primary font-medium truncate max-w-[100px]">
                    {p.player.first_name.charAt(0)}. {p.player.last_name}
                  </span>
                  {playerPosition && (
                    <span className="text-[9px] text-text-muted">{playerPosition}</span>
                  )}
                </div>
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">
                {formatMin(p.min)}
              </td>
              <td className="text-center py-2 px-1.5 text-text-primary font-semibold tabular-nums">
                {formatStatNumber(p.pts)}
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">
                {formatStatNumber(p.reb)}
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">
                {formatStatNumber(p.ast)}
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">
                {formatStatNumber(p.stl)}
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">
                {formatStatNumber(p.blk)}
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums whitespace-nowrap">
                {formatMadeAttempt(p.fgm, p.fga)}
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums whitespace-nowrap">
                {formatMadeAttempt(p.fg3m, p.fg3a)}
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums whitespace-nowrap">
                {formatMadeAttempt(p.ftm, p.fta)}
              </td>
            </tr>
            );
          })}
          {inactivePlayers.length > 0 && (
            <>
              <tr>
                <td
                  colSpan={STAT_COLUMNS.length + 1}
                  className="py-2 px-2 text-text-muted text-[10px] uppercase tracking-wider"
                >
                  Inactive / DNP
                </td>
              </tr>
              {inactivePlayers.map((p) => (
                <tr
                  key={p.player.id}
                  className="border-b border-white/5 opacity-50 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => onPlayerSelect(p)}
                >
                  <td className="py-1.5 px-2 sticky left-0 bg-card">
                    <span className="text-text-muted">
                      {p.player.first_name.charAt(0)}. {p.player.last_name}
                    </span>
                  </td>
                  <td colSpan={STAT_COLUMNS.length} className="text-center py-1.5 text-text-muted">
                    DNP
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PlayerGameStatsModal({
  playerStat,
  onClose,
  onViewProfile,
}: {
  playerStat: NCAABPlayerStat | null;
  onClose: () => void;
  onViewProfile: (playerStat: NCAABPlayerStat) => void;
}) {
  if (!playerStat) return null;

  const playerName = `${playerStat.player.first_name} ${playerStat.player.last_name}`.trim();
  const teamLabel = playerStat.team.abbreviation || playerStat.team.full_name || playerStat.team.name;
  const logo = getNCAABTeamLogoUrl(playerStat.team.abbreviation);
  const playerPosition = cleanPlayerPosition(playerStat.player.position);

  const statCards = [
    { label: "MIN", value: formatMin(playerStat.min) },
    { label: "PTS", value: formatStatNumber(playerStat.pts) },
    { label: "REB", value: formatStatNumber(playerStat.reb) },
    { label: "AST", value: formatStatNumber(playerStat.ast) },
    { label: "STL", value: formatStatNumber(playerStat.stl) },
    { label: "BLK", value: formatStatNumber(playerStat.blk) },
    { label: "TO", value: formatStatNumber(playerStat.turnover) },
    { label: "PF", value: formatStatNumber(playerStat.pf) },
    { label: "FG", value: formatMadeAttempt(playerStat.fgm, playerStat.fga) },
    { label: "FG%", value: formatPct(playerStat.fgm, playerStat.fga) },
    { label: "3P", value: formatMadeAttempt(playerStat.fg3m, playerStat.fg3a) },
    { label: "3P%", value: formatPct(playerStat.fg3m, playerStat.fg3a) },
    { label: "FT", value: formatMadeAttempt(playerStat.ftm, playerStat.fta) },
    { label: "FT%", value: formatPct(playerStat.ftm, playerStat.fta) },
    { label: "OREB", value: formatStatNumber(playerStat.oreb) },
    { label: "DREB", value: formatStatNumber(playerStat.dreb) },
  ];

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-background-secondary shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center overflow-hidden">
              {logo ? (
                <Image src={logo} alt={teamLabel} width={40} height={40} className="w-10 h-10 object-contain" />
              ) : (
                <span className="text-sm font-bold text-accent">
                  {playerStat.player.first_name.charAt(0)}
                  {playerStat.player.last_name.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-text-primary truncate">{playerName}</h3>
              <p className="text-sm text-text-secondary truncate">
                {teamLabel}
                {playerPosition ? ` · ${playerPosition}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <button
            onClick={() => onViewProfile(playerStat)}
            className="w-full mb-4 py-2.5 rounded-xl bg-accent hover:bg-green-500 text-white text-sm font-semibold transition-colors"
          >
            View Player Profile
          </button>
          <div className="grid grid-cols-4 gap-2">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-white/5 p-2 text-center">
                <p className="text-sm font-bold text-text-primary tabular-nums">{stat.value}</p>
                <p className="text-[10px] text-text-muted uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Modal ----
export function NCAABGameDetailModal({ game, isOpen, onClose }: NCAABGameDetailModalProps) {
  const [gameDetail, setGameDetail] = useState<NCAABGameDetail | null>(null);
  const [gamePlays, setGamePlays] = useState<NCAABPlay[]>([]);
  const [playerStats, setPlayerStats] = useState<NCAABPlayerStat[]>([]);
  const [seasonStats, setSeasonStats] = useState<{ home: NCAABTeamSeasonStats | null; away: NCAABTeamSeasonStats | null }>({ home: null, away: null });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTeam, setActiveTeam] = useState<"away" | "home">("away");
  const [selectedPlayerStat, setSelectedPlayerStat] = useState<NCAABPlayerStat | null>(null);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<Player | null>(null);

  const getGameDetail = useAction(api.ncaab.getGameDetail);
  const getGamePlays = useAction(api.ncaab.getGamePlays);
  const getTeamSeasonStats = useAction(api.ncaab.getTeamSeasonStats);

  const fetchData = useCallback(async () => {
    if (!game?.game_id) return;
    setIsLoading(true);
    try {
      const [detailResult, playsResult] = await Promise.all([
        getGameDetail({ gameId: game.game_id }),
        getGamePlays({ gameId: game.game_id }).catch(() => ({ plays: [] as NCAABPlay[] })),
      ]);
      setGameDetail(detailResult.game as NCAABGameDetail);
      setPlayerStats(detailResult.playerStats as NCAABPlayerStat[]);
      setGamePlays((playsResult.plays as NCAABPlay[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch NCAAB game detail:", err);
    } finally {
      setIsLoading(false);
    }
  }, [game?.game_id, getGameDetail]);

  const fetchSeasonStats = useCallback(async () => {
    if (!game) return;
    const homeId = game.home_team.id;
    const awayId = game.away_team.id;
    if (!homeId || !awayId) return;
    try {
      const result = await getTeamSeasonStats({ teamIds: [homeId, awayId] });
      const stats = result.stats as NCAABTeamSeasonStats[];
      const home = stats.find((s) => s.team.id === homeId) ?? null;
      const away = stats.find((s) => s.team.id === awayId) ?? null;
      setSeasonStats({ home, away });
    } catch (err) {
      console.error("Failed to fetch NCAAB season stats:", err);
    }
  }, [game?.home_team.id, game?.away_team.id, getTeamSeasonStats]);

  useEffect(() => {
    if (isOpen && game?.game_id) {
      fetchData();
    }
    if (!isOpen) {
      setGameDetail(null);
      setGamePlays([]);
      setPlayerStats([]);
      setSeasonStats({ home: null, away: null });
      setActiveTeam("away");
      setSelectedPlayerStat(null);
      setSelectedProfilePlayer(null);
    }
  }, [isOpen, game?.game_id]);

  // Fetch season stats for pre-game matchups
  useEffect(() => {
    if (!isOpen || !game) return;
    const isPreGame =
      game.status === "pre" ||
      game.status === "scheduled" ||
      game.status === "" ||
      game.status.includes("T");
    if (isPreGame && game.home_team.id && game.away_team.id) {
      fetchSeasonStats();
    }
  }, [isOpen, game?.game_id, game?.status]);

  // Auto-refresh for live games
  const isFinal =
    game?.status === "Final" ||
    game?.status === "final" ||
    game?.status === "post";
  const isScheduled =
    !game ||
    game.status.includes("T") ||
    game.status === "scheduled" ||
    game.status === "pre" ||
    game.status === "";
  const isLive = !isFinal && !isScheduled;

  useEffect(() => {
    if (!isOpen || !isLive) return;
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [isOpen, isLive, fetchData]);

  // Escape to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !game) return null;

  const homeTeamId = gameDetail?.home_team?.id ?? game.home_team.id;
  const awayTeamId = gameDetail?.visitor_team?.id ?? game.away_team.id;

  const homePlayers = playerStats.filter((p) => p.team.id === homeTeamId);
  const awayPlayers = playerStats.filter((p) => p.team.id === awayTeamId);

  const getCurrentRun = (): { team: "home" | "visitor"; points: number } | null => {
    if (gamePlays.length === 0) return null;

    const getTeamSide = (teamId: number | null | undefined): "home" | "visitor" | null => {
      if (!teamId) return null;
      if (teamId === homeTeamId) return "home";
      if (teamId === awayTeamId) return "visitor";
      return null;
    };

    let activeTeamSide: "home" | "visitor" | null = null;
    let activePoints = 0;
    let prevPlay: NCAABPlay | undefined;

    const scoringPlays = [...gamePlays]
      .filter((p) => p.scoring_play)
      .sort((a, b) => a.order - b.order);

    for (const play of scoringPlays) {
      const side = getTeamSide(play.team?.id);
      if (!side) continue;

      let points = play.score_value ?? 0;
      if (points <= 0 && prevPlay) {
        const curr = side === "home" ? play.home_score : play.away_score;
        const prev = side === "home" ? prevPlay.home_score : prevPlay.away_score;
        points = Math.max(0, (curr ?? 0) - (prev ?? 0));
      }
      prevPlay = play;
      if (points <= 0) continue;

      if (activeTeamSide === side) {
        activePoints += points;
      } else {
        activeTeamSide = side;
        activePoints = points;
      }
    }

    if (!activeTeamSide || activePoints <= 0) return null;
    return { team: activeTeamSide, points: activePoints };
  };

  const currentRun = getCurrentRun();

  const homeLabel =
    game.home_team.abbreviation || game.home_team.name || "HOME";
  const awayLabel =
    game.away_team.abbreviation || game.away_team.name || "AWAY";

  const homeWinning =
    (game.home_team.score ?? 0) > (game.away_team.score ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background-secondary rounded-2xl shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          {/* Status */}
          <div className="flex justify-center mb-4">
            {isLive ? (
              <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500">
                  {game.status_detail || game.status}
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-text-muted">
                {isFinal ? (game.status_detail || "Final") : game.status_detail || game.status || "TBD"}
              </span>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-6">
            {/* Away */}
            <div className="flex flex-col items-center gap-2 flex-1">
              {(() => {
                const logo = getNCAABTeamLogoUrl(game.away_team.abbreviation);
                return logo ? (
                  <Image src={logo} alt={awayLabel} width={48} height={48} className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
                    {game.away_team.seed ?? ""}
                  </div>
                );
              })()}
              <span className="text-sm font-semibold text-text-primary text-center">
                {awayLabel}
              </span>
              {game.away_team.score !== null && (
                <span
                  className={`text-3xl font-bold tabular-nums ${
                    isFinal && !homeWinning
                      ? "text-text-primary"
                      : isFinal
                        ? "text-text-muted"
                        : "text-text-primary"
                  }`}
                >
                  {game.away_team.score}
                </span>
              )}
            </div>

            <span className="text-text-muted text-lg font-medium">vs</span>

            {/* Home */}
            <div className="flex flex-col items-center gap-2 flex-1">
              {(() => {
                const logo = getNCAABTeamLogoUrl(game.home_team.abbreviation);
                return logo ? (
                  <Image src={logo} alt={homeLabel} width={48} height={48} className="w-12 h-12 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
                    {game.home_team.seed ?? ""}
                  </div>
                );
              })()}
              <span className="text-sm font-semibold text-text-primary text-center">
                {homeLabel}
              </span>
              {game.home_team.score !== null && (
                <span
                  className={`text-3xl font-bold tabular-nums ${
                    isFinal && homeWinning
                      ? "text-text-primary"
                      : isFinal
                        ? "text-text-muted"
                        : "text-text-primary"
                  }`}
                >
                  {game.home_team.score}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Half Scores */}
              {gameDetail && <HalfScores bracketGame={game} gameDetail={gameDetail} currentRun={currentRun} />}

              {/* Team Toggle */}
              {playerStats.length > 0 && (
                <>
                  <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                    {(["away", "home"] as const).map((side) => {
                      const team = side === "away" ? game.away_team : game.home_team;
                      const label = side === "away" ? awayLabel : homeLabel;
                      const logo = getNCAABTeamLogoUrl(team.abbreviation);
                      return (
                        <button
                          key={side}
                          onClick={() => setActiveTeam(side)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                            activeTeam === side
                              ? "bg-accent text-white shadow-lg shadow-green-500/20"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          {logo && (
                          <Image src={logo} alt={label} width={16} height={16} className="w-4 h-4 object-contain" />
                          )}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Team Stats */}
                  <TeamStatsCard
                    players={activeTeam === "away" ? awayPlayers : homePlayers}
                    teamLabel={activeTeam === "away" ? awayLabel : homeLabel}
                    teamAbbreviation={activeTeam === "away" ? game.away_team.abbreviation : game.home_team.abbreviation}
                  />

                  {/* Box Score */}
                  <div className="bg-card rounded-xl border border-white/5 overflow-hidden">
                    <BoxScoreTable
                      players={activeTeam === "away" ? awayPlayers : homePlayers}
                      onPlayerSelect={setSelectedPlayerStat}
                    />
                  </div>
                </>
              )}

              {/* Pre-game season stats */}
              {isScheduled && (seasonStats.home || seasonStats.away) && (
                <>
                  <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                    {(["away", "home"] as const).map((side) => {
                      const team = side === "away" ? game.away_team : game.home_team;
                      const label = side === "away" ? awayLabel : homeLabel;
                      const logo = getNCAABTeamLogoUrl(team.abbreviation);
                      return (
                        <button
                          key={side}
                          onClick={() => setActiveTeam(side)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                            activeTeam === side
                              ? "bg-accent text-white shadow-lg shadow-green-500/20"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          {logo && (
                            <Image src={logo} alt={label} width={16} height={16} className="w-4 h-4 object-contain" />
                          )}
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {activeTeam === "away" && seasonStats.away && (
                    <SeasonStatsCard
                      stats={seasonStats.away}
                      teamLabel={awayLabel}
                      teamAbbreviation={game.away_team.abbreviation}
                    />
                  )}
                  {activeTeam === "home" && seasonStats.home && (
                    <SeasonStatsCard
                      stats={seasonStats.home}
                      teamLabel={homeLabel}
                      teamAbbreviation={game.home_team.abbreviation}
                    />
                  )}
                </>
              )}

              {/* No data */}
              {!gameDetail && !isLoading && !isScheduled && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="w-10 h-10 text-text-muted mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm text-text-muted">Box score not available yet</p>
                </div>
              )}

              {/* Pre-game no data yet */}
              {isScheduled && !seasonStats.home && !seasonStats.away && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-text-muted">Game has not started yet</p>
                  <p className="text-xs text-text-muted mt-1">Season stats loading...</p>
                </div>
              )}
            </>
          )}
        </div>

        <PlayerGameStatsModal
          playerStat={selectedPlayerStat}
          onClose={() => setSelectedPlayerStat(null)}
          onViewProfile={(playerStat) => {
            const fullName = `${playerStat.player.first_name} ${playerStat.player.last_name}`.trim();
            setSelectedPlayerStat(null);
            setSelectedProfilePlayer({
              id: String(playerStat.player.id),
              name: fullName,
              sport: "NCAAM",
              team: playerStat.team.full_name || playerStat.team.name || "N/A",
              position: cleanPlayerPosition(playerStat.player.position) ?? "N/A",
              number: cleanJerseyNumber(playerStat.player.jersey_number) ?? "0",
            });
          }}
        />

        <PlayerModal
          player={selectedProfilePlayer}
          isOpen={selectedProfilePlayer !== null}
          onClose={() => setSelectedProfilePlayer(null)}
        />
      </div>
    </div>
  );
}
