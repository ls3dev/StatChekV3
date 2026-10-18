"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { NBA_TEAMS } from "@/lib/nbaTeams";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";
import { GAMES_PER_SEASON, type PredictionCategory } from "@convex/lib/predictions";

export type PredictionPick = {
  category: string;
  slot: number;
  id: number;
  name: string;
  teamAbbr?: string;
};

export function pickKey(category: string, slot: number): string {
  return `${category}:${slot}`;
}

type SlotHandlers = {
  onSelectSlot?: (category: PredictionCategory, slot: number) => void;
  onClearSlot?: (category: PredictionCategory, slot: number) => void;
};

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ballot-orange";

export function BallotSection({
  id,
  title,
  aside,
  children,
}: {
  id: string;
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 pt-14">
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-ballot-chalk/80 pb-2">
        <h2 className="font-scoreboard text-4xl font-extrabold uppercase leading-none text-ballot-chalk">{title}</h2>
        {aside && <span className="text-sm tabular-nums text-ballot-muted">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function ClearButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`shrink-0 rounded-full p-2 text-ballot-muted hover:bg-white/5 hover:text-ballot-chalk transition-colors ${focusRing}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

export function AwardRow({
  category,
  picks,
  onSelectSlot,
  onClearSlot,
}: SlotHandlers & {
  category: PredictionCategory;
  picks: Map<string, PredictionPick>;
}) {
  const pick = picks.get(pickKey(category.key, 0));
  const readOnly = !onSelectSlot;
  const prompt = category.kind === "team" ? "Pick a team" : "Pick a player";

  const body = (
    <>
      <span className="w-24 shrink-0 font-scoreboard text-3xl font-extrabold uppercase leading-none text-ballot-orange sm:w-28 sm:text-4xl">
        {category.shortLabel}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-ballot-muted">{category.label}</span>
        {pick ? (
          <span className="block truncate text-lg font-semibold text-ballot-chalk">
            {pick.name}
            {pick.teamAbbr && category.kind === "player" && (
              <span className="ml-2 text-sm font-normal text-ballot-muted">{pick.teamAbbr}</span>
            )}
          </span>
        ) : (
          <span className="block text-lg text-ballot-muted/70">{readOnly ? "No pick" : prompt}</span>
        )}
      </span>
    </>
  );

  return (
    <div className="flex items-center gap-2 border-b border-ballot-line">
      {readOnly ? (
        <div className="flex min-w-0 flex-1 items-center gap-3 py-4">{body}</div>
      ) : (
        <button
          type="button"
          onClick={() => onSelectSlot(category, 0)}
          className={`group flex min-w-0 flex-1 items-center gap-3 py-4 text-left ${focusRing}`}
        >
          {body}
          {!pick && (
            <span className="shrink-0 text-2xl leading-none text-ballot-muted group-hover:text-ballot-orange transition-colors">
              +
            </span>
          )}
        </button>
      )}
      {pick && onClearSlot && <ClearButton label={`Remove ${pick.name}`} onClick={() => onClearSlot(category, 0)} />}
    </div>
  );
}

export function TeamBlock({
  category,
  picks,
  onSelectSlot,
  onClearSlot,
}: SlotHandlers & {
  category: PredictionCategory;
  picks: Map<string, PredictionPick>;
}) {
  const slots = Array.from({ length: category.slots }, (_, slot) => picks.get(pickKey(category.key, slot)));
  const filled = slots.filter(Boolean).length;
  const readOnly = !onSelectSlot;

  return (
    <div className="mb-8">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="font-scoreboard text-2xl font-extrabold uppercase text-ballot-chalk">{category.label}</h3>
        <span className={`text-sm tabular-nums ${filled === category.slots ? "text-ballot-orange" : "text-ballot-muted"}`}>
          {filled}/{category.slots}
        </span>
      </div>
      <ul>
        {slots.map((pick, slot) => (
          <li key={slot} className="flex items-center gap-2 border-b border-ballot-line">
            {pick ? (
              <>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onSelectSlot?.(category, slot)}
                  className={`flex min-w-0 flex-1 items-baseline gap-2 py-3 text-left disabled:cursor-default ${focusRing}`}
                >
                  <span className="truncate font-semibold text-ballot-chalk">{pick.name}</span>
                  {pick.teamAbbr && <span className="text-sm text-ballot-muted">{pick.teamAbbr}</span>}
                </button>
                {onClearSlot && <ClearButton label={`Remove ${pick.name}`} onClick={() => onClearSlot(category, slot)} />}
              </>
            ) : readOnly ? (
              <span className="py-3 text-ballot-muted/70">—</span>
            ) : (
              <button
                type="button"
                onClick={() => onSelectSlot(category, slot)}
                className={`group flex flex-1 items-center justify-between py-3 text-left text-ballot-muted hover:text-ballot-chalk transition-colors ${focusRing}`}
              >
                <span>Add a player</span>
                <span className="text-xl leading-none group-hover:text-ballot-orange transition-colors">+</span>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StandingsList({
  title,
  teamIds,
  wins,
  onWinsChange,
  onMove,
}: {
  title: string;
  teamIds: number[];
  // Predicted wins per team; omitted for ballots saved before records existed
  wins?: Map<number, number>;
  onWinsChange?: (teamId: number, wins: number) => void;
  onMove?: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <div className="mb-10">
      <h3 className="mb-2 font-scoreboard text-2xl font-extrabold uppercase text-ballot-chalk">{title}</h3>
      <ol>
        {teamIds.map((teamId, index) => {
          const team = NBA_TEAMS[teamId];
          const seed = index + 1;
          const playIn = seed >= 7 && seed <= 10;
          const lottery = seed > 10;
          const teamWins = wins?.get(teamId);
          // Arrows only break ties between teams with the same record
          const tiedAbove = index > 0 && teamWins !== undefined && wins?.get(teamIds[index - 1]) === teamWins;
          const tiedBelow =
            index < teamIds.length - 1 && teamWins !== undefined && wins?.get(teamIds[index + 1]) === teamWins;
          const showArrows = onMove && (wins ? tiedAbove || tiedBelow : true);
          return (
            <li
              key={teamId}
              className={`flex items-center gap-2 border-b border-ballot-line pr-1 sm:gap-3 ${playIn ? "bg-ballot-orange/[0.07]" : ""}`}
            >
              <span
                className={`w-10 shrink-0 text-right font-scoreboard text-3xl font-extrabold leading-[1.15] tabular-nums sm:w-14 sm:text-4xl ${
                  lottery ? "text-ballot-muted/50" : playIn ? "text-ballot-orange/80" : "text-ballot-orange"
                }`}
              >
                {seed}
              </span>
              <Image
                src={getNBATeamLogoUrl(team.abbreviation)}
                alt=""
                width={28}
                height={28}
                className={`h-7 w-7 shrink-0 object-contain ${lottery ? "opacity-50" : ""}`}
                unoptimized
              />
              <span className={`min-w-0 flex-1 truncate ${lottery ? "text-ballot-muted" : "text-ballot-chalk"}`}>
                <span className="font-semibold">{team.name}</span>
                <span className="ml-1.5 hidden text-sm text-ballot-muted sm:inline">{team.city}</span>
              </span>
              {seed === 7 && <span className="hidden text-xs text-ballot-orange/80 md:inline">Play-in</span>}
              {seed === 11 && <span className="hidden text-xs text-ballot-muted md:inline">Lottery</span>}
              {teamWins !== undefined && (
                <span className="flex shrink-0 items-baseline tabular-nums">
                  {onWinsChange ? (
                    <WinsInput
                      teamName={team.name}
                      wins={teamWins}
                      onCommit={(value) => onWinsChange(teamId, value)}
                    />
                  ) : (
                    <span className="font-semibold text-ballot-chalk">{teamWins}</span>
                  )}
                  <span className="text-ballot-muted">–{GAMES_PER_SEASON - teamWins}</span>
                </span>
              )}
              {showArrows && (
                <span className="flex shrink-0">
                  <MoveButton
                    label={`Move ${team.name} up`}
                    disabled={wins ? !tiedAbove : index === 0}
                    onClick={() => onMove(index, -1)}
                    path="M5 15l7-7 7 7"
                  />
                  <MoveButton
                    label={`Move ${team.name} down`}
                    disabled={wins ? !tiedBelow : index === teamIds.length - 1}
                    onClick={() => onMove(index, 1)}
                    path="M19 9l-7 7-7-7"
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-ballot-muted">
        Seeds 7–10 go to the play-in. The shaded rows mark that band.
      </p>
    </div>
  );
}

function WinsInput({
  teamName,
  wins,
  onCommit,
}: {
  teamName: string;
  wins: number;
  onCommit: (wins: number) => void;
}) {
  const [draft, setDraft] = useState(String(wins));

  useEffect(() => {
    setDraft(String(wins));
  }, [wins]);

  // Commit on blur or Enter so the list doesn't re-sort mid-typing
  const commit = () => {
    const parsed = parseInt(draft, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(wins));
      return;
    }
    const clamped = Math.min(GAMES_PER_SEASON, Math.max(0, parsed));
    setDraft(String(clamped));
    if (clamped !== wins) onCommit(clamped);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      value={draft}
      aria-label={`${teamName} predicted wins`}
      onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className="w-9 rounded-md border border-ballot-line bg-transparent py-1 text-center font-semibold text-ballot-chalk focus:border-ballot-orange focus:outline-none"
    />
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
  path,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  path: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`rounded-full p-2 text-ballot-muted hover:bg-white/5 hover:text-ballot-chalk disabled:opacity-20 disabled:hover:bg-transparent transition-colors ${focusRing}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    </button>
  );
}
