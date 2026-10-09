// Shared definitions for season predictions (used by Convex functions and the web app)

export type PredictionCategoryKind = "player" | "team";

export type PredictionCategory = {
  key: string;
  label: string;
  shortLabel: string;
  kind: PredictionCategoryKind;
  slots: number;
  rookiesOnly?: boolean;
  // Categories sharing a group cannot contain the same player twice
  // (e.g. a player can only make one All-NBA team)
  exclusiveGroup?: string;
};

export const AWARD_CATEGORIES: PredictionCategory[] = [
  { key: "mvp", label: "Most Valuable Player", shortLabel: "MVP", kind: "player", slots: 1 },
  { key: "dpoy", label: "Defensive Player of the Year", shortLabel: "DPOY", kind: "player", slots: 1 },
  { key: "roy", label: "Rookie of the Year", shortLabel: "ROY", kind: "player", slots: 1, rookiesOnly: true },
  { key: "smoy", label: "Sixth Man of the Year", shortLabel: "6MOY", kind: "player", slots: 1 },
  { key: "mip", label: "Most Improved Player", shortLabel: "MIP", kind: "player", slots: 1 },
  { key: "clutch", label: "Clutch Player of the Year", shortLabel: "Clutch", kind: "player", slots: 1 },
  { key: "coy", label: "Coach of the Year", shortLabel: "COY", kind: "team", slots: 1 },
];

export const ALL_TEAM_CATEGORIES: PredictionCategory[] = [
  { key: "allNba1", label: "All-NBA First Team", shortLabel: "All-NBA 1st", kind: "player", slots: 5, exclusiveGroup: "allNba" },
  { key: "allNba2", label: "All-NBA Second Team", shortLabel: "All-NBA 2nd", kind: "player", slots: 5, exclusiveGroup: "allNba" },
  { key: "allNba3", label: "All-NBA Third Team", shortLabel: "All-NBA 3rd", kind: "player", slots: 5, exclusiveGroup: "allNba" },
  { key: "allDef1", label: "All-Defensive First Team", shortLabel: "All-Def 1st", kind: "player", slots: 5, exclusiveGroup: "allDef" },
  { key: "allDef2", label: "All-Defensive Second Team", shortLabel: "All-Def 2nd", kind: "player", slots: 5, exclusiveGroup: "allDef" },
  { key: "allRookie1", label: "All-Rookie First Team", shortLabel: "All-Rookie 1st", kind: "player", slots: 5, rookiesOnly: true, exclusiveGroup: "allRookie" },
  { key: "allRookie2", label: "All-Rookie Second Team", shortLabel: "All-Rookie 2nd", kind: "player", slots: 5, rookiesOnly: true, exclusiveGroup: "allRookie" },
];

export const PREDICTION_CATEGORIES: PredictionCategory[] = [
  ...AWARD_CATEGORIES,
  ...ALL_TEAM_CATEGORIES,
];

export const PREDICTION_CATEGORY_MAP: Record<string, PredictionCategory> =
  Object.fromEntries(PREDICTION_CATEGORIES.map((c) => [c.key, c]));

// Ball Don't Lie team IDs by conference
export const EAST_TEAM_IDS = [1, 2, 3, 4, 5, 6, 9, 12, 16, 17, 20, 22, 23, 28, 30];
export const WEST_TEAM_IDS = [7, 8, 10, 11, 13, 14, 15, 18, 19, 21, 24, 25, 26, 27, 29];

export function formatSeasonLabel(season: number): string {
  return `${season}-${(season + 1).toString().slice(-2)}`;
}
