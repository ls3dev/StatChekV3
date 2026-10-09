"use client";

import Image from "next/image";
import { NBA_TEAMS } from "@/lib/nbaTeams";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";
import type { PredictionCategory } from "@convex/lib/predictions";

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

function PickSlot({
  category,
  slot,
  pick,
  onSelectSlot,
  onClearSlot,
  compact,
}: SlotHandlers & {
  category: PredictionCategory;
  slot: number;
  pick?: PredictionPick;
  compact?: boolean;
}) {
  const readOnly = !onSelectSlot;
  const placeholder = category.kind === "team" ? "Pick a team" : "Pick a player";

  if (!pick) {
    if (readOnly) {
      return (
        <div className={`rounded-lg border border-dashed border-white/10 px-3 ${compact ? "py-2" : "py-3"}`}>
          <p className="text-sm text-text-muted">No pick</p>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => onSelectSlot(category, slot)}
        className={`w-full rounded-lg border border-dashed border-white/15 hover:border-accent/60 hover:bg-accent/5 px-3 ${
          compact ? "py-2" : "py-3"
        } text-left text-sm text-text-secondary hover:text-text-primary transition-colors`}
      >
        + {placeholder}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-background-secondary px-3 ${
        compact ? "py-2" : "py-3"
      }`}
    >
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onSelectSlot?.(category, slot)}
        className="min-w-0 flex-1 text-left disabled:cursor-default"
      >
        <p className="truncate text-sm font-semibold text-text-primary">{pick.name}</p>
        {pick.teamAbbr && <p className="text-xs text-text-secondary">{pick.teamAbbr}</p>}
      </button>
      {onClearSlot && (
        <button
          type="button"
          onClick={() => onClearSlot(category, slot)}
          className="shrink-0 rounded-md p-1 text-text-muted hover:bg-white/10 hover:text-text-primary transition-colors"
          aria-label={`Remove ${pick.name}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function AwardCard({
  category,
  picks,
  ...handlers
}: SlotHandlers & {
  category: PredictionCategory;
  picks: Map<string, PredictionPick>;
}) {
  return (
    <div className="bg-card rounded-xl border border-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-accent">{category.shortLabel}</p>
      <p className="mb-3 text-sm text-text-secondary">{category.label}</p>
      <PickSlot category={category} slot={0} pick={picks.get(pickKey(category.key, 0))} {...handlers} />
    </div>
  );
}

export function AllTeamCard({
  category,
  picks,
  ...handlers
}: SlotHandlers & {
  category: PredictionCategory;
  picks: Map<string, PredictionPick>;
}) {
  const filled = Array.from({ length: category.slots }).filter((_, slot) =>
    picks.has(pickKey(category.key, slot))
  ).length;

  return (
    <div className="bg-card rounded-xl border border-white/5">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="font-semibold text-text-primary">{category.label}</p>
        <p className="text-xs tabular-nums text-text-secondary">
          {filled}/{category.slots}
        </p>
      </div>
      <div className="space-y-2 p-3">
        {Array.from({ length: category.slots }).map((_, slot) => (
          <PickSlot
            key={slot}
            category={category}
            slot={slot}
            pick={picks.get(pickKey(category.key, slot))}
            compact
            {...handlers}
          />
        ))}
      </div>
    </div>
  );
}

export function SeedingColumn({
  title,
  teamIds,
  onMove,
}: {
  title: string;
  teamIds: number[];
  onMove?: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-white/5">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="font-semibold text-text-primary">{title}</p>
      </div>
      <ol className="p-2">
        {teamIds.map((teamId, index) => {
          const team = NBA_TEAMS[teamId];
          const seed = index + 1;
          return (
            <li key={teamId}>
              {seed === 7 && <SeedDivider label="Play-In" />}
              {seed === 11 && <SeedDivider label="Lottery" />}
              <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <span className="w-5 text-right text-sm font-semibold tabular-nums text-text-secondary">
                  {seed}
                </span>
                <Image
                  src={getNBATeamLogoUrl(team.abbreviation)}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                  unoptimized
                />
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                  <span className="sm:hidden">{team.abbreviation}</span>
                  <span className="hidden sm:inline">
                    {team.city} {team.name}
                  </span>
                </span>
                {onMove && (
                  <div className="flex shrink-0 gap-1">
                    <MoveButton
                      label={`Move ${team.name} up`}
                      disabled={index === 0}
                      onClick={() => onMove(index, -1)}
                      path="M5 15l7-7 7 7"
                    />
                    <MoveButton
                      label={`Move ${team.name} down`}
                      disabled={index === teamIds.length - 1}
                      onClick={() => onMove(index, 1)}
                      path="M19 9l-7 7-7-7"
                    />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function SeedDivider({ label }: { label: string }) {
  return (
    <div className="my-1 flex items-center gap-2 px-2">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
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
      className="rounded-md p-1.5 text-text-secondary hover:bg-white/10 hover:text-text-primary disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    </button>
  );
}
