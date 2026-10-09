"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  ALL_TEAM_CATEGORIES,
  AWARD_CATEGORIES,
  PREDICTIONS_PATH,
  formatSeasonLabel,
} from "@convex/lib/predictions";
import {
  AwardRow,
  BallotSection,
  StandingsList,
  TeamBlock,
  pickKey,
  type PredictionPick,
} from "@/components/predictions/PredictionCards";
import { SaveImageButton } from "@/components/predictions/SaveImageButton";
import { scoreboardFont } from "@/lib/predictionsFont";

const primaryButton =
  "rounded-full bg-ballot-orange px-5 py-2 text-sm font-semibold text-black hover:bg-ballot-orange/90 disabled:opacity-60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ballot-chalk";
const secondaryButton =
  "rounded-full border border-ballot-line px-4 py-2 text-sm font-semibold text-ballot-chalk hover:border-ballot-muted disabled:opacity-60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ballot-orange";

export function SharedPredictionsView({ shareId }: { shareId: string }) {
  const predictions = useQuery(api.predictions.getPredictionsByShareId, { shareId });

  const picks = useMemo(
    () =>
      new Map<string, PredictionPick>(
        (predictions?.picks ?? []).map((p) => [pickKey(p.category, p.slot), p])
      ),
    [predictions]
  );

  if (predictions === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-primary">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-ballot-orange border-t-transparent" />
      </main>
    );
  }

  if (predictions === null) {
    return (
      <main className={`${scoreboardFont.variable} min-h-screen bg-background-primary`}>
        <div className="mx-auto max-w-[640px] px-4 py-20">
          <h1 className="font-scoreboard text-6xl font-extrabold uppercase leading-[0.85] text-ballot-chalk">
            Ballot not found
          </h1>
          <p className="mt-4 text-ballot-muted">
            This link doesn&apos;t match any saved picks. Ask for the link again, or make your own.
          </p>
          <Link href={PREDICTIONS_PATH} className={`mt-8 inline-block ${primaryButton}`}>
            Make your picks
          </Link>
        </div>
      </main>
    );
  }

  const author = predictions.displayName ? `@${predictions.displayName}` : "A StatCheck fan";

  return (
    <main className={`${scoreboardFont.variable} min-h-screen bg-background-primary pb-20`}>
      <div className="mx-auto max-w-[640px] px-4">
        <header className="pt-10">
          <p className="text-lg font-semibold text-ballot-orange">{author}</p>
          <h1 className="mt-2 font-scoreboard text-[clamp(2.75rem,13.4vw,5rem)] font-extrabold uppercase leading-[0.82] text-ballot-chalk">
            {formatSeasonLabel(predictions.season)}
            <br />
            Predictions
          </h1>
          <p className="mt-5 text-sm text-ballot-muted">
            Last updated {new Date(predictions.updatedAt).toLocaleDateString()}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={PREDICTIONS_PATH} className={primaryButton}>
              Make your picks
            </Link>
            <SaveImageButton shareId={predictions.shareId} version={predictions.updatedAt} className={secondaryButton} />
          </div>
        </header>

        <BallotSection id="awards" title="Awards">
          {AWARD_CATEGORIES.map((category) => (
            <AwardRow key={category.key} category={category} picks={picks} />
          ))}
        </BallotSection>

        <BallotSection id="teams" title="All-NBA teams">
          {ALL_TEAM_CATEGORIES.map((category) => (
            <TeamBlock key={category.key} category={category} picks={picks} />
          ))}
        </BallotSection>

        <BallotSection id="standings" title="Standings">
          <StandingsList title="Eastern Conference" teamIds={predictions.eastSeeding} />
          <StandingsList title="Western Conference" teamIds={predictions.westSeeding} />
        </BallotSection>
      </div>
    </main>
  );
}
