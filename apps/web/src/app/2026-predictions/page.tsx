"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { NBA_TEAMS } from "@/lib/nbaTeams";
import {
  ALL_TEAM_CATEGORIES,
  AWARD_CATEGORIES,
  EAST_TEAM_IDS,
  PREDICTION_CATEGORIES,
  PREDICTION_CATEGORY_MAP,
  PREDICTIONS_PATH,
  PREDICTIONS_SEASON,
  WEST_TEAM_IDS,
  formatSeasonLabel,
  type PredictionCategory,
} from "@convex/lib/predictions";
import {
  AllTeamCard,
  AwardCard,
  SeedingColumn,
  pickKey,
  type PredictionPick,
} from "@/components/predictions/PredictionCards";
import { PickerModal, type PickerSelection } from "@/components/predictions/PickerModal";
import { SaveImageButton } from "@/components/predictions/SaveImageButton";

type Tab = "awards" | "teams" | "seeding";

type Standing = {
  team: { id: number };
  conference_rank: number;
};

const TOTAL_SLOTS = PREDICTION_CATEGORIES.reduce((sum, c) => sum + c.slots, 0);

function sortAlphabetically(teamIds: number[]): number[] {
  return [...teamIds].sort((a, b) =>
    `${NBA_TEAMS[a].city} ${NBA_TEAMS[a].name}`.localeCompare(`${NBA_TEAMS[b].city} ${NBA_TEAMS[b].name}`)
  );
}

function sortByStandings(teamIds: number[], standings: Standing[]): number[] {
  const rankByTeam = new Map(standings.map((s) => [s.team.id, s.conference_rank]));
  return [...teamIds].sort((a, b) => (rankByTeam.get(a) ?? 99) - (rankByTeam.get(b) ?? 99));
}

export default function PredictionsPage() {
  const { isAuthenticated, isLoading: authLoading, signIn } = useAuth();
  const season = PREDICTIONS_SEASON;
  const myPredictions = useQuery(api.predictions.getMyPredictions);
  const savePredictions = useMutation(api.predictions.savePredictions);
  const getStandings = useAction(api.nba.getStandings);

  const [tab, setTab] = useState<Tab>("awards");
  const [picks, setPicks] = useState<Map<string, PredictionPick>>(new Map());
  const [eastSeeding, setEastSeeding] = useState(() => sortAlphabetically(EAST_TEAM_IDS));
  const [westSeeding, setWestSeeding] = useState(() => sortAlphabetically(WEST_TEAM_IDS));
  const [activeSlot, setActiveSlot] = useState<{ category: PredictionCategory; slot: number } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [seededFromLastSeason, setSeededFromLastSeason] = useState(false);

  const hydratedFromServer = useRef(false);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Load saved predictions once they arrive (unless the user already started editing)
  useEffect(() => {
    if (!myPredictions || hydratedFromServer.current || isDirty) return;
    hydratedFromServer.current = true;
    setPicks(new Map(myPredictions.picks.map((p) => [pickKey(p.category, p.slot), p])));
    setEastSeeding(myPredictions.eastSeeding);
    setWestSeeding(myPredictions.westSeeding);
    setShareId(myPredictions.shareId);
  }, [myPredictions, isDirty]);

  // Default seeding to last season's final standings
  useEffect(() => {
    let cancelled = false;
    getStandings({ season: season - 1 })
      .then(({ standings }) => {
        if (cancelled || hydratedFromServer.current || isDirtyRef.current) return;
        const typed = standings as Standing[];
        if (typed.length === 0) return;
        setEastSeeding(sortByStandings(EAST_TEAM_IDS, typed));
        setWestSeeding(sortByStandings(WEST_TEAM_IDS, typed));
        setSeededFromLastSeason(true);
      })
      .catch((error) => console.error("Failed loading last season standings", error));
    return () => {
      cancelled = true;
    };
  }, [season, getStandings]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const markDirty = () => {
    setIsDirty(true);
    setMessage(null);
  };

  const takenIds = useMemo(() => {
    const taken = new Map<number, string>();
    if (!activeSlot) return taken;
    const { category, slot } = activeSlot;
    for (const pick of picks.values()) {
      if (pick.category === category.key && pick.slot === slot) continue;
      const pickCategory = PREDICTION_CATEGORY_MAP[pick.category];
      const sameGroup = category.exclusiveGroup
        ? pickCategory?.exclusiveGroup === category.exclusiveGroup
        : pick.category === category.key;
      if (sameGroup) taken.set(pick.id, pickCategory?.shortLabel ?? pick.category);
    }
    return taken;
  }, [activeSlot, picks]);

  const handleSelect = (selection: PickerSelection) => {
    if (!activeSlot) return;
    const { category, slot } = activeSlot;
    setPicks((prev) => {
      const next = new Map(prev);
      next.set(pickKey(category.key, slot), { category: category.key, slot, ...selection });
      return next;
    });
    setActiveSlot(null);
    markDirty();
  };

  const handleClear = (category: PredictionCategory, slot: number) => {
    setPicks((prev) => {
      const next = new Map(prev);
      next.delete(pickKey(category.key, slot));
      return next;
    });
    markDirty();
  };

  const moveTeam = (conference: "east" | "west") => (index: number, direction: -1 | 1) => {
    const setSeeding = conference === "east" ? setEastSeeding : setWestSeeding;
    setSeeding((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    markDirty();
  };

  const closePicker = useCallback(() => setActiveSlot(null), []);

  const handleSave = async () => {
    if (!isAuthenticated) {
      signIn();
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const result = await savePredictions({
        picks: Array.from(picks.values()).map(({ category, slot, id, name, teamAbbr }) => ({
          category,
          slot,
          id,
          name,
          teamAbbr,
        })),
        eastSeeding,
        westSeeding,
      });
      hydratedFromServer.current = true;
      setShareId(result.shareId);
      setIsDirty(false);
      setMessage({ type: "success", text: "Predictions saved." });
    } catch (saveError) {
      console.error("Saving predictions failed", saveError);
      setMessage({ type: "error", text: "Could not save your predictions. Try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareId) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${PREDICTIONS_PATH}/${shareId}`);
      setMessage({ type: "success", text: "Share link copied to clipboard." });
    } catch {
      setMessage({ type: "error", text: "Could not copy the link." });
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }

  const countFilled = (categories: PredictionCategory[]) =>
    categories.reduce(
      (sum, c) =>
        sum + Array.from({ length: c.slots }).filter((_, slot) => picks.has(pickKey(c.key, slot))).length,
      0
    );
  const awardSlots = AWARD_CATEGORIES.reduce((sum, c) => sum + c.slots, 0);
  const teamSlots = ALL_TEAM_CATEGORIES.reduce((sum, c) => sum + c.slots, 0);

  const tabs: { key: Tab; label: string; progress?: string }[] = [
    { key: "awards", label: "Awards", progress: `${countFilled(AWARD_CATEGORIES)}/${awardSlots}` },
    { key: "teams", label: "All-NBA Teams", progress: `${countFilled(ALL_TEAM_CATEGORIES)}/${teamSlots}` },
    { key: "seeding", label: "Seeding" },
  ];

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <Link href="/" className="mb-6 inline-block text-text-secondary hover:text-text-primary transition-colors">
          ← Back
        </Link>

        <div className="mb-6 rounded-xl border border-white/5 bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
                {formatSeasonLabel(season)} Predictions
              </h1>
              <p className="mt-1 text-text-secondary">
                Call the awards, All-NBA teams, and the final East and West standings.
              </p>
              <p className="mt-2 text-sm text-text-muted">
                {picks.size}/{TOTAL_SLOTS} picks made
                {isDirty && <span className="text-yellow-300"> · Unsaved changes</span>}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {shareId && !isDirty && (
                <>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="rounded-lg bg-background-secondary px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/10 transition-colors"
                  >
                    Copy Share Link
                  </button>
                  <SaveImageButton shareId={shareId} version={myPredictions?.updatedAt ?? 0} />
                  <Link
                    href={`${PREDICTIONS_PATH}/${shareId}`}
                    className="rounded-lg bg-background-secondary px-4 py-2 text-sm font-semibold text-text-primary hover:bg-white/10 transition-colors"
                  >
                    View
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || (isAuthenticated && !isDirty)}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {!isAuthenticated
                  ? "Sign In to Save"
                  : isSaving
                    ? "Saving..."
                    : isDirty
                      ? "Save Predictions"
                      : "Saved"}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="sticky top-16 z-30 -mx-4 mb-6 bg-background-primary/90 px-4 py-2 backdrop-blur-lg md:mx-0 md:px-0">
          <div className="inline-flex gap-1 rounded-xl bg-background-secondary p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-4 ${
                  tab === t.key ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.label}
                {t.progress && (
                  <span className={`ml-1.5 text-xs tabular-nums ${tab === t.key ? "text-white/80" : "text-text-muted"}`}>
                    {t.progress}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {tab === "awards" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AWARD_CATEGORIES.map((category) => (
              <AwardCard
                key={category.key}
                category={category}
                picks={picks}
                onSelectSlot={(c, slot) => setActiveSlot({ category: c, slot })}
                onClearSlot={handleClear}
              />
            ))}
          </div>
        )}

        {tab === "teams" && (
          <div className="grid gap-4 md:grid-cols-2">
            {ALL_TEAM_CATEGORIES.map((category) => (
              <AllTeamCard
                key={category.key}
                category={category}
                picks={picks}
                onSelectSlot={(c, slot) => setActiveSlot({ category: c, slot })}
                onClearSlot={handleClear}
              />
            ))}
          </div>
        )}

        {tab === "seeding" && (
          <>
            {seededFromLastSeason && !hydratedFromServer.current && !isDirty && (
              <p className="mb-4 text-sm text-text-secondary">
                Starting from last season&apos;s final standings. Use the arrows to reorder.
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <SeedingColumn title="Eastern Conference" teamIds={eastSeeding} onMove={moveTeam("east")} />
              <SeedingColumn title="Western Conference" teamIds={westSeeding} onMove={moveTeam("west")} />
            </div>
          </>
        )}
      </div>

      {activeSlot && (
        <PickerModal
          category={activeSlot.category}
          slot={activeSlot.slot}
          season={season}
          takenIds={takenIds}
          onSelect={handleSelect}
          onClose={closePicker}
        />
      )}
    </main>
  );
}
