"use client";

import Image from "next/image";
import type { NCAABBracketGame, NCAABBracketTeam } from "@convex/lib/ncaabBracket";
import { getNCAABTeamLogoUrl } from "@/lib/ncaabTeamLogos";

function TeamRow({ team, opponent, isScheduled }: {
  team: NCAABBracketTeam;
  opponent: NCAABBracketTeam;
  isScheduled: boolean;
}) {
  const isWinner = team.winner === true;
  const isLoser = opponent.winner === true;
  const hasScore = team.score !== null;
  const isTopSeed = team.seed !== null && Number(team.seed) <= 4;
  const logoUrl = getNCAABTeamLogoUrl(team.abbreviation);

  return (
    <div
      className={`flex items-center justify-between py-2.5 px-3 min-h-[44px] ${
        isLoser ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {team.seed !== null && (
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isTopSeed
                ? "bg-accent/20 text-accent"
                : "bg-background-secondary text-text-secondary"
            }`}
          >
            {team.seed}
          </span>
        )}
        {logoUrl && (
          <Image
            src={logoUrl}
            alt={team.abbreviation || ""}
            width={24}
            height={24}
            className="w-6 h-6 object-contain shrink-0"
          />
        )}
        <span
          className={`text-sm ${
            isWinner
              ? "font-bold text-text-primary"
              : "font-semibold text-text-secondary"
          }`}
        >
          {team.name ?? "TBD"}
        </span>
      </div>
      {hasScore && !isScheduled && (
        <span
          className={`text-lg tabular-nums ml-3 ${
            isWinner ? "font-bold text-text-primary" : "font-medium text-text-muted"
          }`}
        >
          {team.score}
        </span>
      )}
    </div>
  );
}

export function MatchupCard({
  game,
  currentRun,
  onClick,
}: {
  game: NCAABBracketGame;
  currentRun?: { team: "home" | "visitor"; points: number } | null;
  onClick?: () => void;
}) {
  const isFinal =
    game.status === "Final" ||
    game.status === "final" ||
    game.status === "post";
  const isScheduled =
    game.status.includes("T") ||
    game.status === "scheduled" ||
    game.status === "pre";
  const isLive = !isFinal && !isScheduled && game.status !== "";

  const getStatusText = () => {
    if (isFinal) return game.status_detail || "Final";
    if (isLive) return game.status_detail || game.status;
    if (game.date) {
      try {
        const d = new Date(game.date);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
        }
      } catch {
        // fallthrough
      }
    }
    return game.status || "TBD";
  };

  const broadcastText =
    game.broadcasts && game.broadcasts.length > 0
      ? game.broadcasts.join(" · ")
      : null;
  const awayRun =
    currentRun
      ? currentRun.team === "visitor"
        ? { text: `${currentRun.points}-0`, hot: true }
        : { text: `0-${currentRun.points}`, hot: false }
      : null;
  const homeRun =
    currentRun
      ? currentRun.team === "home"
        ? { text: `${currentRun.points}-0`, hot: true }
        : { text: `0-${currentRun.points}`, hot: false }
      : null;

  const isClickable = !!onClick && game.game_id !== null;

  return (
    <div
      className={`bg-card rounded-xl p-4 relative ${
        isClickable ? "cursor-pointer hover:bg-card-hover transition-colors" : ""
      }`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {/* LIVE badge */}
      {isLive && (
        <div className="absolute top-3 right-3 hidden sm:flex items-center gap-1.5 bg-red-500/10 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-red-500 uppercase">LIVE</span>
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center gap-2 mb-2 px-3">
        <span
          className={`text-xs font-medium ${
            isLive
              ? "text-red-500"
              : isFinal
                ? "text-text-muted"
                : "text-text-secondary"
          }`}
        >
          {getStatusText()}
        </span>
        {broadcastText && (
          <span className="text-[11px] text-text-muted">
            {broadcastText}
          </span>
        )}
      </div>

      {/* Teams */}
      <TeamRow team={game.away_team} opponent={game.home_team} isScheduled={isScheduled} />
      {isLive && awayRun && (
        <div className="px-3 pb-1">
          <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded ${awayRun.hot ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
            {awayRun.hot ? "🔥" : "🥶"} {awayRun.text}
          </span>
        </div>
      )}
      <div className="border-t border-white/10 mx-3" />
      <TeamRow team={game.home_team} opponent={game.away_team} isScheduled={isScheduled} />
      {isLive && homeRun && (
        <div className="px-3 pt-1">
          <span className={`inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded ${homeRun.hot ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
            {homeRun.hot ? "🔥" : "🥶"} {homeRun.text}
          </span>
        </div>
      )}
    </div>
  );
}

export function MatchupCardCompact({
  game,
  currentRun,
  onClick,
}: {
  game: NCAABBracketGame;
  currentRun?: { team: "home" | "visitor"; points: number } | null;
  onClick?: () => void;
}) {
  const isFinal =
    game.status === "Final" ||
    game.status === "final" ||
    game.status === "post";
  const isLive =
    !isFinal &&
    !game.status.includes("T") &&
    game.status !== "scheduled" &&
    game.status !== "pre" &&
    game.status !== "";

  const isClickable = !!onClick && game.game_id !== null;

  return (
    <div
      className={`bg-card rounded-lg p-1.5 text-[11px] w-[180px] shrink-0 relative ${
        isClickable ? "cursor-pointer hover:bg-card-hover transition-colors" : ""
      }`}
      onClick={isClickable ? onClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {isLive && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
      {[game.away_team, game.home_team].map((team, i) => {
        const opponent = i === 0 ? game.home_team : game.away_team;
        const isWinner = team.winner === true;
        const isLoser = opponent.winner === true;
        const logo = getNCAABTeamLogoUrl(team.abbreviation);
        const run =
          currentRun
            ? currentRun.team === (i === 0 ? "visitor" : "home")
              ? { text: `${currentRun.points}-0`, hot: true }
              : { text: `0-${currentRun.points}`, hot: false }
            : null;
        return (
          <div
            key={i}
            className={`flex items-center justify-between py-0.5 px-1 ${
              isLoser ? "opacity-40" : ""
            } ${i === 0 ? "border-b border-white/5" : ""}`}
          >
            <div className="flex items-center gap-1 min-w-0">
              {team.seed !== null && (
                <span className="text-[10px] text-text-muted w-3 text-right">{team.seed}</span>
              )}
              {logo && (
                <Image
                  src={logo}
                  alt={team.abbreviation || ""}
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
              )}
              <span className={`truncate ${isWinner ? "font-bold text-text-primary" : "text-text-secondary"}`}>
                {team.abbreviation || team.name || "TBD"}
              </span>
            </div>
            {team.score !== null && (
              <div className="flex items-center gap-1 ml-1">
                {isLive && run && (
                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${run.hot ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {run.hot ? "🔥" : "🥶"}
                  </span>
                )}
                <span className={`tabular-nums ${isWinner ? "font-bold text-text-primary" : "text-text-muted"}`}>
                  {team.score}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
