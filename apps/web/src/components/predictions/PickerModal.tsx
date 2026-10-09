"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { NBA_TEAM_LIST } from "@/lib/nbaTeams";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";
import type { PredictionCategory } from "@convex/lib/predictions";

type PlayerResult = {
  id: number;
  name: string;
  position: string;
  teamAbbr: string | null;
  draftYear: number | null;
};

export type PickerSelection = {
  id: number;
  name: string;
  teamAbbr?: string;
};

type PickerModalProps = {
  category: PredictionCategory;
  slot: number;
  season: number;
  // Player/team id -> where it is already picked (e.g. "All-NBA 1st")
  takenIds: Map<number, string>;
  onSelect: (selection: PickerSelection) => void;
  onClose: () => void;
};

export function PickerModal({ category, slot, season, takenIds, onSelect, onClose }: PickerModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const title = category.slots > 1 ? `${category.label} · Slot ${slot + 1}` : category.label;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl sm:rounded-2xl border border-ballot-line bg-ballot-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {category.kind === "team" ? (
          <TeamGrid takenIds={takenIds} onSelect={onSelect} />
        ) : (
          <PlayerSearchPanel category={category} season={season} takenIds={takenIds} onSelect={onSelect} />
        )}
      </div>
    </div>
  );
}

function TeamGrid({
  takenIds,
  onSelect,
}: {
  takenIds: Map<number, string>;
  onSelect: (selection: PickerSelection) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 overflow-y-auto p-4">
      {NBA_TEAM_LIST.map((team) => (
        <button
          key={team.id}
          type="button"
          disabled={takenIds.has(team.id)}
          onClick={() =>
            onSelect({ id: team.id, name: `${team.city} ${team.name}`, teamAbbr: team.abbreviation })
          }
          className="flex flex-col items-center gap-1 rounded-lg border border-white/10 px-2 py-3 hover:border-ballot-orange/60 hover:bg-ballot-orange/5 disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-transparent transition-colors"
        >
          <Image
            src={getNBATeamLogoUrl(team.abbreviation)}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            unoptimized
          />
          <span className="text-xs font-semibold text-text-primary">{team.abbreviation}</span>
        </button>
      ))}
    </div>
  );
}

function PlayerSearchPanel({
  category,
  season,
  takenIds,
  onSelect,
}: {
  category: PredictionCategory;
  season: number;
  takenIds: Map<number, string>;
  onSelect: (selection: PickerSelection) => void;
}) {
  const searchPlayers = useAction(api.predictions.searchPredictionPlayers);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchPlayers({ query: trimmed });
        if (!cancelled) setResults(data);
      } catch (searchError) {
        console.error("Prediction player search failed", searchError);
        if (!cancelled) {
          setResults([]);
          setError("Search failed. Try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, searchPlayers]);

  const visibleResults = category.rookiesOnly
    ? results.filter((player) => player.draftYear === season)
    : results;
  const hiddenNonRookies = results.length - visibleResults.length;

  return (
    <>
      <div className="px-5 pt-4">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={category.rookiesOnly ? `Search ${season} rookies...` : "Search players..."}
          className="w-full rounded-lg border border-white/10 bg-background-primary px-4 py-2.5 text-ballot-chalk placeholder:text-text-muted focus:border-ballot-orange focus:outline-none"
        />
        {category.rookiesOnly && (
          <p className="mt-2 text-xs text-text-muted">Only players from the {season} draft class are shown.</p>
        )}
      </div>

      <div className="min-h-[200px] overflow-y-auto p-3">
        {isLoading && (
          <div className="flex justify-center p-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-ballot-orange border-t-transparent" />
          </div>
        )}
        {!isLoading && error && <p className="p-4 text-center text-sm text-red-300">{error}</p>}
        {!isLoading && !error && query.trim().length >= 2 && visibleResults.length === 0 && (
          <p className="p-4 text-center text-sm text-text-secondary">
            {hiddenNonRookies > 0 ? "No rookies match that name." : "No players found."}
          </p>
        )}
        {!isLoading &&
          visibleResults.map((player) => {
            const takenBy = takenIds.get(player.id);
            return (
              <button
                key={player.id}
                type="button"
                disabled={!!takenBy}
                onClick={() =>
                  onSelect({ id: player.id, name: player.name, teamAbbr: player.teamAbbr ?? undefined })
                }
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{player.name}</p>
                  <p className="text-xs text-text-secondary">
                    {[player.teamAbbr, player.position].filter(Boolean).join(" · ")}
                  </p>
                </div>
                {takenBy && <span className="shrink-0 text-xs text-text-muted">On {takenBy}</span>}
              </button>
            );
          })}
      </div>
    </>
  );
}
