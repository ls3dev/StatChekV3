"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  PREDICTION_CATEGORIES,
  PREDICTIONS_PATH,
  PREDICTIONS_SEASON,
  formatSeasonLabel,
} from "@convex/lib/predictions";
import { NBA_TEAMS } from "@/lib/nbaTeams";
import { SaveImageButton } from "@/components/predictions/SaveImageButton";

const TOTAL_SLOTS = PREDICTION_CATEGORIES.reduce((sum, c) => sum + c.slots, 0);

export function ProfilePredictionsCard() {
  const predictions = useQuery(api.predictions.getMyPredictions);
  const seasonLabel = formatSeasonLabel(PREDICTIONS_SEASON);

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
        {seasonLabel} Predictions
      </h2>
      <div className="bg-background-primary rounded-xl p-4">
        {predictions === undefined ? (
          <div className="flex justify-center p-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : predictions === null ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Call the awards, All-NBA teams, and seeding for the {seasonLabel} season.
            </p>
            <Link
              href={PREDICTIONS_PATH}
              className="shrink-0 rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-500 transition-colors"
            >
              Make Your Picks
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Summary label="MVP" value={predictions.picks.find((p) => p.category === "mvp")?.name} />
              <Summary label="East #1" value={teamName(predictions.eastSeeding[0])} />
              <Summary label="West #1" value={teamName(predictions.westSeeding[0])} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-text-muted">
                {predictions.picks.length}/{TOTAL_SLOTS} picks · Updated{" "}
                {new Date(predictions.updatedAt).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={PREDICTIONS_PATH}
                  className="rounded-lg bg-background-secondary px-3 py-2 text-sm font-semibold text-text-primary hover:bg-white/10 transition-colors"
                >
                  Edit
                </Link>
                <Link
                  href={`${PREDICTIONS_PATH}/${predictions.shareId}`}
                  className="rounded-lg bg-background-secondary px-3 py-2 text-sm font-semibold text-text-primary hover:bg-white/10 transition-colors"
                >
                  View
                </Link>
                <SaveImageButton
                  shareId={predictions.shareId}
                  version={predictions.updatedAt}
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-60 transition-colors"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function teamName(teamId: number | undefined): string | undefined {
  const team = teamId !== undefined ? NBA_TEAMS[teamId] : undefined;
  return team?.name;
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="truncate text-sm font-semibold text-text-primary">{value ?? "—"}</p>
    </div>
  );
}
