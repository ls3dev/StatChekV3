"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";

interface Team {
  id: number;
  full_name: string;
  abbreviation: string;
  city: string;
  name: string;
}

interface Game {
  id: number;
  date: string;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: Team;
  home_team_score: number;
  visitor_team: Team;
  visitor_team_score: number;
}

interface PlayerBoxScore {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
  };
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  turnover: number;
  plus_minus: number | null;
}

interface BoxScoreTeam extends Team {
  players: PlayerBoxScore[];
}

interface BoxScore {
  home_team: BoxScoreTeam;
  home_team_score: number;
  visitor_team: BoxScoreTeam;
  visitor_team_score: number;
  home_q1: number;
  home_q2: number;
  home_q3: number;
  home_q4: number;
  home_ot1: number | null;
  home_ot2: number | null;
  home_ot3: number | null;
  visitor_q1: number;
  visitor_q2: number;
  visitor_q3: number;
  visitor_q4: number;
  visitor_ot1: number | null;
  visitor_ot2: number | null;
  visitor_ot3: number | null;
}

interface GamePlay {
  id: number;
  description: string | null;
  clock: string | null;
  period: number;
  home_score: number | null;
  away_score: number | null;
  score_value: number | null;
  scoring_play: boolean;
  order: number;
  team: Team | null;
}

interface TeamSeasonStats {
  team_id: number;
  season: number;
  games: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  wins: number;
  losses: number;
}

interface GameDetailModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayerClick?: (playerName: string, teamAbbr: string) => void;
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

function formatTeamPct(made: number, attempted: number) {
  if (attempted === 0) return "-";
  return ((made / attempted) * 100).toFixed(1) + "%";
}

function formatTeamStatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (Math.abs(value - Math.round(value)) < 0.05) return Math.round(value).toString();
  return value.toFixed(1);
}

function formatTeamStatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function getSeasonForGameDate(dateString: string) {
  const gameDate = new Date(dateString);
  const year = gameDate.getFullYear();
  const month = gameDate.getMonth() + 1;
  return month >= 10 ? year : year - 1;
}

function isScheduledGameStatus(game: Game) {
  return game.status !== "Final" && (game.status.includes("T") || game.period === 0);
}

function computeTeamTotals(players: PlayerBoxScore[]) {
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
    { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, turnover: 0, fgm: 0, fga: 0, fg3m: 0, fg3a: 0, ftm: 0, fta: 0 }
  );
}

// ---- Quarter Scores ----
function QuarterScores({
  game,
  boxScore,
  currentRun,
}: {
  game: Game;
  boxScore: BoxScore;
  currentRun: { team: "home" | "visitor"; points: number } | null;
}) {
  const quarters = [
    { label: "Q1", home: boxScore.home_q1, visitor: boxScore.visitor_q1 },
    { label: "Q2", home: boxScore.home_q2, visitor: boxScore.visitor_q2 },
    { label: "Q3", home: boxScore.home_q3, visitor: boxScore.visitor_q3 },
    { label: "Q4", home: boxScore.home_q4, visitor: boxScore.visitor_q4 },
  ];
  if (boxScore.home_ot1 !== null) quarters.push({ label: "OT1", home: boxScore.home_ot1, visitor: boxScore.visitor_ot1! });
  if (boxScore.home_ot2 !== null) quarters.push({ label: "OT2", home: boxScore.home_ot2, visitor: boxScore.visitor_ot2! });
  if (boxScore.home_ot3 !== null) quarters.push({ label: "OT3", home: boxScore.home_ot3, visitor: boxScore.visitor_ot3! });

  const getRunText = (side: "home" | "visitor") => {
    if (!currentRun) return null;
    if (currentRun.team === side) return { text: `${currentRun.points}-0`, hot: true };
    return { text: `0-${currentRun.points}`, hot: false };
  };

  const visitorRun = getRunText("visitor");
  const homeRun = getRunText("home");

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      {/* Labels row */}
      <div className="grid items-center text-center text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-white/5 py-2"
        style={{ gridTemplateColumns: `60px repeat(${quarters.length}, 1fr) 50px 70px` }}
      >
        <div />
        {quarters.map((q) => <div key={q.label}>{q.label}</div>)}
        <div>T</div>
        <div>RUN</div>
      </div>
      {/* Visitor row */}
      <div className="grid items-center text-center py-2 border-b border-white/5"
        style={{ gridTemplateColumns: `60px repeat(${quarters.length}, 1fr) 50px 70px` }}
      >
        <div className="text-xs font-semibold text-text-primary pl-3 text-left">{game.visitor_team.abbreviation}</div>
        {quarters.map((q) => <div key={q.label} className="text-xs text-text-secondary tabular-nums">{q.visitor}</div>)}
        <div className="text-xs font-bold text-text-primary tabular-nums">{boxScore.visitor_team_score}</div>
        <div className="flex justify-center">
          {visitorRun && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${visitorRun.hot ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
              {visitorRun.hot ? "🔥" : "🥶"} {visitorRun.text}
            </span>
          )}
        </div>
      </div>
      {/* Home row */}
      <div className="grid items-center text-center py-2"
        style={{ gridTemplateColumns: `60px repeat(${quarters.length}, 1fr) 50px 70px` }}
      >
        <div className="text-xs font-semibold text-text-primary pl-3 text-left">{game.home_team.abbreviation}</div>
        {quarters.map((q) => <div key={q.label} className="text-xs text-text-secondary tabular-nums">{q.home}</div>)}
        <div className="text-xs font-bold text-text-primary tabular-nums">{boxScore.home_team_score}</div>
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
  game,
  boxScore,
  selectedTeam,
  seasonStats,
  isScheduled,
}: {
  game: Game;
  boxScore: BoxScore | null;
  selectedTeam: "home" | "visitor";
  seasonStats: { home: TeamSeasonStats | null; visitor: TeamSeasonStats | null };
  isScheduled: boolean;
}) {
  const teamInfo = selectedTeam === "home" ? game.home_team : game.visitor_team;

  let statCards: { label: string; value: string }[];

  if (isScheduled) {
    const stats = selectedTeam === "home" ? seasonStats.home : seasonStats.visitor;
    if (!stats) return null;
    statCards = [
      { label: "REC", value: `${stats.wins}-${stats.losses}` },
      { label: "PPG", value: formatTeamStatNumber(stats.pts) },
      { label: "RPG", value: formatTeamStatNumber(stats.reb) },
      { label: "APG", value: formatTeamStatNumber(stats.ast) },
      { label: "FG%", value: formatTeamStatPercent(stats.fg_pct) },
      { label: "3PT%", value: formatTeamStatPercent(stats.fg3_pct) },
      { label: "FT%", value: formatTeamStatPercent(stats.ft_pct) },
      { label: "STL", value: formatTeamStatNumber(stats.stl) },
      { label: "BLK", value: formatTeamStatNumber(stats.blk) },
      { label: "TO", value: formatTeamStatNumber(stats.turnover) },
    ];
  } else {
    if (!boxScore) return null;
    const team = selectedTeam === "home" ? boxScore.home_team : boxScore.visitor_team;
    const totals = computeTeamTotals(team.players);
    statCards = [
      { label: "PTS", value: String(totals.pts) },
      { label: "REB", value: String(totals.reb) },
      { label: "AST", value: String(totals.ast) },
      { label: "FG%", value: formatTeamPct(totals.fgm, totals.fga) },
      { label: "3PT%", value: formatTeamPct(totals.fg3m, totals.fg3a) },
      { label: "FT%", value: formatTeamPct(totals.ftm, totals.fta) },
      { label: "STL", value: String(totals.stl) },
      { label: "BLK", value: String(totals.blk) },
      { label: "TO", value: String(totals.turnover) },
    ];
  }

  return (
    <div className="bg-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-text-primary">
            {isScheduled ? "Season Team Stats" : "Game Team Stats"}
          </p>
          <p className="text-[10px] text-text-muted">
            {isScheduled ? "Per-game averages" : "Totals from this matchup"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
          <Image
            src={getNBATeamLogoUrl(teamInfo.abbreviation)}
            alt={teamInfo.abbreviation}
            width={16}
            height={16}
            className="w-4 h-4"
          />
          <span className="text-xs font-semibold text-text-primary">{teamInfo.abbreviation}</span>
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
  team,
  teamAbbr,
  onPlayerClick,
}: {
  team: BoxScoreTeam;
  teamAbbr: string;
  onPlayerClick?: (player: PlayerBoxScore) => void;
}) {
  const activePlayers = team.players
    .filter((p) => p.min && p.min !== "00" && p.min !== "0" && p.min !== "00:00")
    .sort((a, b) => parseInt(b.min?.split(":")[0] ?? "0") - parseInt(a.min?.split(":")[0] ?? "0"));

  const inactivePlayers = team.players.filter(
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
              <th key={col.key} className="text-center py-2 px-1.5 text-text-muted font-semibold min-w-[40px]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activePlayers.map((p) => (
            <tr
              key={p.player.id}
              className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => onPlayerClick?.(p)}
            >
              <td className="py-2 px-2 sticky left-0 bg-card">
                <div className="flex items-center gap-1.5">
                  <span className="text-text-primary font-medium truncate max-w-[100px]">
                    {p.player.first_name.charAt(0)}. {p.player.last_name}
                  </span>
                  {p.player.position && (
                    <span className="text-[9px] text-text-muted">{p.player.position}</span>
                  )}
                </div>
              </td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">{formatMin(p.min)}</td>
              <td className="text-center py-2 px-1.5 text-text-primary font-semibold tabular-nums">{p.pts}</td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">{p.reb}</td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">{p.ast}</td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">{p.stl}</td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums">{p.blk}</td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums whitespace-nowrap">{p.fgm}-{p.fga}</td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums whitespace-nowrap">{p.fg3m}-{p.fg3a}</td>
              <td className="text-center py-2 px-1.5 text-text-secondary tabular-nums whitespace-nowrap">{p.ftm}-{p.fta}</td>
            </tr>
          ))}
          {inactivePlayers.length > 0 && (
            <>
              <tr>
                <td colSpan={STAT_COLUMNS.length + 1} className="py-2 px-2 text-text-muted text-[10px] uppercase tracking-wider">
                  Inactive / DNP
                </td>
              </tr>
              {inactivePlayers.map((p) => (
                <tr key={p.player.id} className="border-b border-white/5 opacity-50">
                  <td className="py-1.5 px-2 sticky left-0 bg-card">
                    <span className="text-text-muted">{p.player.first_name.charAt(0)}. {p.player.last_name}</span>
                  </td>
                  <td colSpan={STAT_COLUMNS.length} className="text-center py-1.5 text-text-muted">DNP</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---- Player Box Score Card (overlay within modal) ----
function PlayerBoxScoreCard({
  player,
  teamAbbr,
  onClose,
  onViewProfile,
}: {
  player: PlayerBoxScore;
  teamAbbr: string;
  onClose: () => void;
  onViewProfile: () => void;
}) {
  const fullName = `${player.player.first_name} ${player.player.last_name}`;
  const initials = `${player.player.first_name[0]}${player.player.last_name[0]}`;
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/players/search?q=${encodeURIComponent(fullName)}&sport=NBA`)
      .then((res) => res.json())
      .then((results) => {
        const normalizedName = fullName.trim().toLowerCase();
        const normalizedTeam = teamAbbr.trim().toLowerCase();
        const bestMatch =
          results.find(
            (result: { name?: string; team?: string; photoUrl?: string }) =>
              result.name?.trim().toLowerCase() === normalizedName &&
              result.team?.trim().toLowerCase() === normalizedTeam
          ) ??
          results.find(
            (result: { name?: string; photoUrl?: string }) =>
              result.name?.trim().toLowerCase() === normalizedName
          ) ??
          results[0];

        if (bestMatch?.photoUrl) {
          setPhotoUrl(bestMatch.photoUrl);
        }
      })
      .catch(() => {});
  }, [fullName, teamAbbr]);

  const fgPct = player.fga > 0 ? ((player.fgm / player.fga) * 100).toFixed(1) : "0.0";
  const fg3Pct = player.fg3a > 0 ? ((player.fg3m / player.fg3a) * 100).toFixed(1) : "0.0";
  const ftPct = player.fta > 0 ? ((player.ftm / player.fta) * 100).toFixed(1) : "0.0";

  const formatPlusMinus = (val: number | null) => {
    if (val === null || val === undefined) return "-";
    return val > 0 ? `+${val}` : String(val);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-background-secondary rounded-2xl shadow-2xl w-[90%] max-w-sm mx-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={fullName}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-accent/50"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-text-primary truncate">{fullName}</p>
            {player.player.position && (
              <p className="text-xs text-text-muted">{player.player.position}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Stats */}
        <div className="flex justify-around px-4 py-3 border-y border-white/5">
          <div className="text-center">
            <p className="text-xl font-bold text-text-primary tabular-nums">{player.pts}</p>
            <p className="text-[10px] text-text-muted">PTS</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-text-primary tabular-nums">{player.reb}</p>
            <p className="text-[10px] text-text-muted">REB</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-text-primary tabular-nums">{player.ast}</p>
            <p className="text-[10px] text-text-muted">AST</p>
          </div>
          <div className="text-center">
            <p className={`text-xl font-bold tabular-nums ${
              player.plus_minus !== null && player.plus_minus > 0
                ? "text-green-400"
                : player.plus_minus !== null && player.plus_minus < 0
                  ? "text-red-400"
                  : "text-text-primary"
            }`}>
              {formatPlusMinus(player.plus_minus)}
            </p>
            <p className="text-[10px] text-text-muted">+/-</p>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="px-4 py-3 space-y-2">
          {[
            { label: "Minutes", value: player.min || "-" },
            { label: "Field Goals", value: `${player.fgm}-${player.fga} (${fgPct}%)` },
            { label: "3-Pointers", value: `${player.fg3m}-${player.fg3a} (${fg3Pct}%)` },
            { label: "Free Throws", value: `${player.ftm}-${player.fta} (${ftPct}%)` },
            { label: "Steals", value: String(player.stl) },
            { label: "Blocks", value: String(player.blk) },
            { label: "Turnovers", value: String(player.turnover) },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="text-xs text-text-muted">{row.label}</span>
              <span className="text-xs font-semibold text-text-primary tabular-nums">{row.value}</span>
            </div>
          ))}
        </div>

        {/* View Full Profile */}
        <button
          onClick={onViewProfile}
          className="w-full flex items-center justify-center gap-2 py-3 border-t border-white/5 text-accent hover:bg-white/5 transition-colors"
        >
          <span className="text-sm font-semibold">View Full Profile</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---- Main Modal ----
export function GameDetailModal({
  game,
  isOpen,
  onClose,
  onPlayerClick,
}: GameDetailModalProps) {
  const router = useRouter();
  const [boxScore, setBoxScore] = useState<BoxScore | null>(null);
  const [gamePlays, setGamePlays] = useState<GamePlay[]>([]);
  const [seasonTeamStats, setSeasonTeamStats] = useState<{
    home: TeamSeasonStats | null;
    visitor: TeamSeasonStats | null;
  }>({ home: null, visitor: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [activeTeam, setActiveTeam] = useState<"visitor" | "home">("visitor");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerBoxScore | null>(null);

  const getBoxScore = useAction(api.nba.getBoxScore);
  const getGamePlays = useAction(api.nba.getGamePlays);
  const getTeamSeasonAverages = useAction(api.nba.getTeamSeasonAverages);

  const fetchBoxScore = useCallback(async () => {
    if (!game) return;
    setIsLoading(true);
    setBoxScore(null);
    setGamePlays([]);

    try {
      const canLoadPlays = getSeasonForGameDate(game.date) >= 2025;
      const [boxResult, playsResult] = await Promise.all([
        getBoxScore({
          date: game.date.split("T")[0],
          homeTeamId: game.home_team.id,
          visitorTeamId: game.visitor_team.id,
        }),
        canLoadPlays
          ? getGamePlays({ gameId: game.id }).catch(() => ({ plays: [] as GamePlay[] }))
          : Promise.resolve({ plays: [] as GamePlay[] }),
      ]);

      setBoxScore(boxResult.boxScore as unknown as BoxScore | null);
      setIsLive(boxResult.isLive);
      setGamePlays((playsResult.plays as GamePlay[]) ?? []);
    } catch (error) {
      console.error("Failed to fetch box score:", error);
    } finally {
      setIsLoading(false);
    }
  }, [game, getBoxScore, getGamePlays]);

  const fetchSeasonStats = useCallback(async () => {
    if (!game) return;
    try {
      const result = await getTeamSeasonAverages({
        teamIds: [game.home_team.id, game.visitor_team.id],
        season: getSeasonForGameDate(game.date),
        seasonType: game.postseason ? "playoffs" : "regular",
      });
      const stats = result.stats as TeamSeasonStats[];
      setSeasonTeamStats({
        home: stats.find((t) => t.team_id === game.home_team.id) ?? null,
        visitor: stats.find((t) => t.team_id === game.visitor_team.id) ?? null,
      });
    } catch (error) {
      console.error("Failed to fetch season stats:", error);
    }
  }, [game, getTeamSeasonAverages]);

  useEffect(() => {
    if (isOpen && game) {
      const scheduled = isScheduledGameStatus(game);
      if (scheduled) {
        setBoxScore(null);
        setGamePlays([]);
        fetchSeasonStats();
      } else {
        setSeasonTeamStats({ home: null, visitor: null });
        fetchBoxScore();
      }
    }
    if (!isOpen) {
      setBoxScore(null);
      setGamePlays([]);
      setSeasonTeamStats({ home: null, visitor: null });
      setActiveTeam("visitor");
      setIsLive(false);
      setSelectedPlayer(null);
    }
  }, [isOpen, game?.id]);

  // Auto-refresh live games
  useEffect(() => {
    if (!isOpen || !isLive) return;
    const interval = setInterval(fetchBoxScore, 30_000);
    return () => clearInterval(interval);
  }, [isOpen, isLive, fetchBoxScore]);

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

  const isFinal = game.status === "Final";
  const isScheduled = isScheduledGameStatus(game) && !isLive && !boxScore;
  const isLiveGame = !isFinal && !isScheduled;
  const homeWinning = game.home_team_score > game.visitor_team_score;

  const getStatusText = () => {
    if (isFinal) return "Final";
    if (isLiveGame) return game.time || game.status;
    try {
      const date = new Date(game.status);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return game.status;
    }
  };

  // Compute current run from plays
  const getCurrentRun = (): { team: "home" | "visitor"; points: number } | null => {
    if (gamePlays.length === 0) return null;

    const getTeamSide = (teamId: number | null | undefined): "home" | "visitor" | null => {
      if (!teamId) return null;
      if (teamId === game.home_team.id) return "home";
      if (teamId === game.visitor_team.id) return "visitor";
      return null;
    };

    let activeTeamSide: "home" | "visitor" | null = null;
    let activePoints = 0;
    let prevPlay: GamePlay | undefined;

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

  const handleTeamClick = (teamId: number) => {
    onClose();
    router.push(`/team/${teamId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background-secondary rounded-2xl shadow-2xl">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10">
          <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Game Header */}
        <div className="px-6 pt-6 pb-4">
          {/* Status */}
          <div className="flex justify-center mb-4">
            {isLiveGame ? (
              <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500">{getStatusText()}</span>
              </div>
            ) : (
              <span className="text-xs font-medium text-text-muted">{getStatusText()}</span>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-6">
            {/* Visitor - clickable */}
            <button
              onClick={() => handleTeamClick(game.visitor_team.id)}
              className="flex flex-col items-center gap-2 flex-1 hover:opacity-80 transition-opacity"
            >
              <Image
                src={getNBATeamLogoUrl(game.visitor_team.abbreviation)}
                alt={game.visitor_team.full_name}
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <span className="text-sm font-semibold text-text-primary">{game.visitor_team.abbreviation}</span>
              {!isScheduled && (
                <span className={`text-3xl font-bold tabular-nums ${isFinal && !homeWinning ? "text-text-primary" : isFinal ? "text-text-muted" : "text-text-primary"}`}>
                  {game.visitor_team_score}
                </span>
              )}
            </button>

            <span className="text-text-muted text-lg font-medium">@</span>

            {/* Home - clickable */}
            <button
              onClick={() => handleTeamClick(game.home_team.id)}
              className="flex flex-col items-center gap-2 flex-1 hover:opacity-80 transition-opacity"
            >
              <Image
                src={getNBATeamLogoUrl(game.home_team.abbreviation)}
                alt={game.home_team.full_name}
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <span className="text-sm font-semibold text-text-primary">{game.home_team.abbreviation}</span>
              {!isScheduled && (
                <span className={`text-3xl font-bold tabular-nums ${isFinal && homeWinning ? "text-text-primary" : isFinal ? "text-text-muted" : "text-text-primary"}`}>
                  {game.home_team_score}
                </span>
              )}
            </button>
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
              {/* Quarter Scores */}
              {boxScore && (
                <QuarterScores game={game} boxScore={boxScore} currentRun={currentRun} />
              )}

              {/* Team Toggle */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setActiveTeam("visitor")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                    activeTeam === "visitor"
                      ? "bg-accent text-white shadow-lg shadow-green-500/20"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Image
                    src={getNBATeamLogoUrl(game.visitor_team.abbreviation)}
                    alt={game.visitor_team.abbreviation}
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  {game.visitor_team.abbreviation}
                </button>
                <button
                  onClick={() => setActiveTeam("home")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                    activeTeam === "home"
                      ? "bg-accent text-white shadow-lg shadow-green-500/20"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Image
                    src={getNBATeamLogoUrl(game.home_team.abbreviation)}
                    alt={game.home_team.abbreviation}
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  {game.home_team.abbreviation}
                </button>
              </div>

              {/* Team Stats */}
              <TeamStatsCard
                game={game}
                boxScore={boxScore}
                selectedTeam={activeTeam}
                seasonStats={seasonTeamStats}
                isScheduled={isScheduled}
              />

              {/* Box Score Table */}
              {boxScore && (
                <div className="bg-card rounded-xl border border-white/5 overflow-hidden">
                  <BoxScoreTable
                    team={activeTeam === "visitor" ? boxScore.visitor_team : boxScore.home_team}
                    teamAbbr={activeTeam === "visitor" ? game.visitor_team.abbreviation : game.home_team.abbreviation}
                    onPlayerClick={setSelectedPlayer}
                  />
                </div>
              )}

              {/* No data state */}
              {!boxScore && !isScheduled && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg className="w-10 h-10 text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-text-muted">Box score not available yet</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Player Box Score Card Overlay */}
        {selectedPlayer && (
          <PlayerBoxScoreCard
            player={selectedPlayer}
            teamAbbr={
              activeTeam === "visitor"
                ? game.visitor_team.abbreviation
                : game.home_team.abbreviation
            }
            onClose={() => setSelectedPlayer(null)}
            onViewProfile={() => {
              const name = `${selectedPlayer.player.first_name} ${selectedPlayer.player.last_name}`;
              setSelectedPlayer(null);
              onClose();
              onPlayerClick?.(
                name,
                activeTeam === "visitor"
                  ? game.visitor_team.abbreviation
                  : game.home_team.abbreviation
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
