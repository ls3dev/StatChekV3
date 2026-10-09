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
  AllTeamCard,
  AwardCard,
  SeedingColumn,
  pickKey,
  type PredictionPick,
} from "@/components/predictions/PredictionCards";
import { SaveImageButton } from "@/components/predictions/SaveImageButton";

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </main>
    );
  }

  if (predictions === null) {
    return (
      <main className="min-h-screen bg-background-primary">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center md:px-6">
          <h1 className="text-2xl font-bold text-text-primary">Predictions not found</h1>
          <p className="mt-2 text-text-secondary">This link may be wrong or the predictions were removed.</p>
          <Link
            href={PREDICTIONS_PATH}
            className="mt-6 inline-block rounded-lg bg-accent px-5 py-2.5 font-semibold text-white hover:bg-green-500 transition-colors"
          >
            Make Your Own Predictions
          </Link>
        </div>
      </main>
    );
  }

  const author = predictions.displayName ? `@${predictions.displayName}` : "A StatCheck user";

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-8 rounded-xl border border-white/5 bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
                {formatSeasonLabel(predictions.season)} Predictions
              </h1>
              <p className="mt-1 text-text-secondary">
                by {author} · Updated {new Date(predictions.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <SaveImageButton shareId={predictions.shareId} version={predictions.updatedAt} />
              <Link
                href={PREDICTIONS_PATH}
                className="rounded-lg bg-accent px-5 py-2 text-center text-sm font-semibold text-white hover:bg-green-500 transition-colors"
              >
                Make Your Own
              </Link>
            </div>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-text-primary">Awards</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AWARD_CATEGORIES.map((category) => (
              <AwardCard key={category.key} category={category} picks={picks} />
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-text-primary">All-NBA Teams</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {ALL_TEAM_CATEGORIES.map((category) => (
              <AllTeamCard key={category.key} category={category} picks={picks} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-text-primary">Seeding</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <SeedingColumn title="Eastern Conference" teamIds={predictions.eastSeeding} />
            <SeedingColumn title="Western Conference" teamIds={predictions.westSeeding} />
          </div>
        </section>
      </div>
    </main>
  );
}
