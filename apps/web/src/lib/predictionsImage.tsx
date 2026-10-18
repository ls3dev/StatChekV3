import { NBA_TEAMS } from "@/lib/nbaTeams";
import {
  ALL_TEAM_CATEGORIES,
  AWARD_CATEGORIES,
  GAMES_PER_SEASON,
  PREDICTIONS_PATH,
  formatSeasonLabel,
} from "@convex/lib/predictions";

// Rendered by next/og (satori): inline styles only, and every element with
// more than one child needs display: flex

export const PREDICTIONS_IMAGE_SIZE = { width: 1080, height: 1350 };

export type PredictionsImageData = {
  season: number;
  displayName?: string;
  picks: Array<{ category: string; slot: number; name: string; teamAbbr?: string }>;
  eastSeeding: number[];
  westSeeding: number[];
  teamWins?: Array<{ teamId: number; wins: number }>;
};

const COLORS = {
  background: "#0A0A0F",
  card: "#1A1A24",
  accent: "#FF6B1A",
  textPrimary: "#F4F1E8",
  textSecondary: "#A1A1AA",
  textMuted: "#71717A",
  divider: "rgba(255,255,255,0.08)",
};

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const suffixes = new Set(["Jr.", "Jr", "Sr.", "II", "III", "IV"]);
  if (parts.length > 2 && suffixes.has(parts[parts.length - 1])) {
    return parts.slice(-2).join(" ");
  }
  return parts[parts.length - 1];
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 2,
        color: COLORS.accent,
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function SeedingList({
  title,
  teamIds,
  wins,
}: {
  title: string;
  teamIds: number[];
  wins?: Map<number, number>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 6 }}>
        {title}
      </div>
      {teamIds.map((teamId, index) => {
        const team = NBA_TEAMS[teamId];
        const seed = index + 1;
        return (
          <div
            key={teamId}
            style={{
              display: "flex",
              alignItems: "center",
              height: 25,
              fontSize: 17,
              borderTop: seed === 7 || seed === 11 ? `1px solid ${COLORS.divider}` : "1px solid transparent",
              color: seed <= 6 ? COLORS.textPrimary : seed <= 10 ? COLORS.textSecondary : COLORS.textMuted,
            }}
          >
            <div style={{ display: "flex", width: 30, justifyContent: "flex-end", marginRight: 12, color: COLORS.textMuted }}>
              {String(seed)}
            </div>
            <div style={{ display: "flex", flex: 1 }}>{team ? `${team.city} ${team.name}` : "—"}</div>
            {wins?.has(teamId) && (
              <div style={{ display: "flex", marginRight: 4 }}>
                {`${wins.get(teamId)}–${GAMES_PER_SEASON - wins.get(teamId)!}`}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PredictionsImage({ data }: { data: PredictionsImageData }) {
  const pickFor = (category: string, slot: number) =>
    data.picks.find((p) => p.category === category && p.slot === slot);
  const winsByTeam = data.teamWins ? new Map(data.teamWins.map((t) => [t.teamId, t.wins])) : undefined;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: COLORS.background,
        color: COLORS.textPrimary,
        padding: "48px 56px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: COLORS.accent }}>StatCheck</div>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>
            {`${formatSeasonLabel(data.season)} NBA Predictions`}
          </div>
        </div>
        {data.displayName && (
          <div style={{ display: "flex", fontSize: 24, color: COLORS.textSecondary }}>{`@${data.displayName}`}</div>
        )}
      </div>

      {/* Awards */}
      <div style={{ display: "flex", flexDirection: "column", background: COLORS.card, borderRadius: 20, padding: "22px 28px", marginBottom: 20 }}>
        <SectionTitle>Awards</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {AWARD_CATEGORIES.map((category) => {
            const pick = pickFor(category.key, 0);
            return (
              <div key={category.key} style={{ display: "flex", alignItems: "baseline", width: "50%", height: 36 }}>
                <div style={{ display: "flex", width: 90, fontSize: 18, fontWeight: 700, color: COLORS.textMuted }}>
                  {category.shortLabel}
                </div>
                <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: pick ? COLORS.textPrimary : COLORS.textMuted }}>
                  {pick ? pick.name : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All-NBA / Defense / Rookie teams */}
      <div style={{ display: "flex", flexDirection: "column", background: COLORS.card, borderRadius: 20, padding: "22px 28px", marginBottom: 20 }}>
        <SectionTitle>All-League Teams</SectionTitle>
        {ALL_TEAM_CATEGORIES.map((category) => {
          const names = Array.from({ length: category.slots })
            .map((_, slot) => pickFor(category.key, slot))
            .filter((p): p is NonNullable<typeof p> => !!p)
            .map((p) => lastName(p.name));
          const line = names.join(" · ");
          return (
            <div key={category.key} style={{ display: "flex", alignItems: "baseline", height: 38 }}>
              <div style={{ display: "flex", width: 190, fontSize: 18, fontWeight: 700, color: COLORS.textMuted }}>
                {category.shortLabel}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: line.length > 62 ? 18 : 21,
                  color: names.length ? COLORS.textPrimary : COLORS.textMuted,
                }}
              >
                {names.length ? line : "—"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seeding */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, background: COLORS.card, borderRadius: 20, padding: "22px 28px" }}>
        <SectionTitle>Seeding</SectionTitle>
        <div style={{ display: "flex", gap: 32 }}>
          <SeedingList title="East" teamIds={data.eastSeeding} wins={winsByTeam} />
          <SeedingList title="West" teamIds={data.westSeeding} wins={winsByTeam} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 18, fontSize: 18, color: COLORS.textMuted }}>
        {`Make your picks at statcheckapp.com${PREDICTIONS_PATH}`}
      </div>
    </div>
  );
}
