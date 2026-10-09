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
  AwardRow,
  BallotSection,
  StandingsList,
  TeamBlock,
  pickKey,
  type PredictionPick,
} from "@/components/predictions/PredictionCards";
import { scoreboardFont } from "@/lib/predictionsFont";
import { PickerModal, type PickerSelection } from "@/components/predictions/PickerModal";
import { SaveImageButton } from "@/components/predictions/SaveImageButton";

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
      setMessage({ type: "success", text: "Picks saved." });
    } catch (saveError) {
      console.error("Saving predictions failed", saveError);
      setMessage({ type: "error", text: "Picks didn't save. Check your connection and try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareId) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${PREDICTIONS_PATH}/${shareId}`);
      setMessage({ type: "success", text: "Link copied." });
    } catch {
      setMessage({ type: "error", text: "Couldn't copy the link. Open your shared ballot and copy it from the address bar." });
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ballot-orange border-t-transparent" />
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
  const progress = picks.size / TOTAL_SLOTS;
  const openPicker = (category: PredictionCategory, slot: number) => setActiveSlot({ category, slot });

  const sections = [
    { id: "awards", label: "Awards", count: `${countFilled(AWARD_CATEGORIES)}/${awardSlots}` },
    { id: "teams", label: "All-NBA", count: `${countFilled(ALL_TEAM_CATEGORIES)}/${teamSlots}` },
    { id: "standings", label: "Standings" },
  ];

  const secondaryButton =
    "rounded-full border border-ballot-line px-4 py-2 text-sm font-semibold text-ballot-chalk hover:border-ballot-muted transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ballot-orange";

  return (
    <main className={`${scoreboardFont.variable} min-h-screen bg-background-primary pb-32`}>
      <div className="mx-auto max-w-[640px] px-4">
        <header className="pt-8">
          <Link href="/" className="text-sm text-ballot-muted hover:text-ballot-chalk transition-colors">
            ← StatCheck
          </Link>
          <h1 className="mt-6 font-scoreboard text-[clamp(2.75rem,13.4vw,5rem)] font-extrabold uppercase leading-[0.82] text-ballot-chalk">
            {formatSeasonLabel(season)}
            <br />
            Predictions
          </h1>
          <p className="mt-5 max-w-md text-ballot-muted">
            Call the awards, the All-NBA teams, and how both conferences finish before the season tips off.
          </p>
          {shareId && !isDirty && (
            <Link
              href={`${PREDICTIONS_PATH}/${shareId}`}
              className="mt-3 inline-block text-sm font-semibold text-ballot-orange hover:underline"
            >
              Open your shared ballot
            </Link>
          )}
        </header>

        <nav
          aria-label="Ballot sections"
          className="sticky top-16 z-30 -mx-4 mt-8 border-b border-ballot-line bg-background-primary/95 px-4 backdrop-blur-lg"
        >
          <div className="flex gap-6 py-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-sm font-semibold text-ballot-chalk hover:text-ballot-orange transition-colors"
              >
                {section.label}
                {section.count && <span className="ml-1.5 font-normal tabular-nums text-ballot-muted">{section.count}</span>}
              </a>
            ))}
          </div>
          <div
            className="absolute bottom-[-1px] left-0 h-[2px] bg-ballot-orange transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${progress * 100}%` }}
            role="progressbar"
            aria-label="Picks made"
            aria-valuenow={picks.size}
            aria-valuemin={0}
            aria-valuemax={TOTAL_SLOTS}
          />
        </nav>

        <BallotSection id="awards" title="Awards">
          {AWARD_CATEGORIES.map((category) => (
            <AwardRow
              key={category.key}
              category={category}
              picks={picks}
              onSelectSlot={openPicker}
              onClearSlot={handleClear}
            />
          ))}
        </BallotSection>

        <BallotSection id="teams" title="All-NBA teams">
          {ALL_TEAM_CATEGORIES.map((category) => (
            <TeamBlock
              key={category.key}
              category={category}
              picks={picks}
              onSelectSlot={openPicker}
              onClearSlot={handleClear}
            />
          ))}
        </BallotSection>

        <BallotSection
          id="standings"
          title="Standings"
          aside={seededFromLastSeason && !hydratedFromServer.current && !isDirty ? "Starts from last season" : undefined}
        >
          <StandingsList title="Eastern Conference" teamIds={eastSeeding} onMove={moveTeam("east")} />
          <StandingsList title="Western Conference" teamIds={westSeeding} onMove={moveTeam("west")} />
        </BallotSection>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ballot-line bg-background-primary/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p
            role="status"
            className={`min-w-0 truncate text-sm ${
              message?.type === "error" ? "text-red-300" : isDirty ? "text-ballot-orange" : "text-ballot-muted"
            }`}
          >
            {message?.text ?? (isDirty ? "Unsaved changes" : `${picks.size} of ${TOTAL_SLOTS} picks`)}
          </p>
          <div className="flex shrink-0 gap-2">
            {shareId && !isDirty ? (
              <>
                <button type="button" onClick={copyShareLink} className={secondaryButton}>
                  Copy link
                </button>
                <SaveImageButton
                  shareId={shareId}
                  version={myPredictions?.updatedAt ?? 0}
                  className="rounded-full bg-ballot-orange px-4 py-2 text-sm font-semibold text-black hover:bg-ballot-orange/90 disabled:opacity-60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ballot-chalk"
                />
              </>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || (isAuthenticated && !isDirty)}
                className="rounded-full bg-ballot-orange px-5 py-2 text-sm font-semibold text-black hover:bg-ballot-orange/90 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ballot-chalk"
              >
                {!isAuthenticated ? "Sign in to save" : isSaving ? "Saving..." : "Save picks"}
              </button>
            )}
          </div>
        </div>
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
