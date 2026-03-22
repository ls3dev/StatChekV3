"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { PlayerSearch } from "@/components/PlayerSearch";
import { PlayerModal } from "@/components/PlayerModal";
import { RoundView } from "@/components/bracket/RoundView";
import { FullBracket } from "@/components/bracket/FullBracket";
import type { Player } from "@/lib/types";
import {
  type NCAABBracketGame,
  getRegionForLocation,
  deriveRegionNames,
} from "@convex/lib/ncaabBracket";
import { useAuth } from "@/hooks/useAuth";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";
import { usePlayerSearch } from "@/hooks/usePlayerSearch";
import type { Sport } from "@/hooks/usePlayerSearch";

const NBA_TEAMS: { id: number; name: string; city: string; abbreviation: string }[] = [
  { id: 1, name: "Hawks", city: "Atlanta", abbreviation: "ATL" },
  { id: 2, name: "Celtics", city: "Boston", abbreviation: "BOS" },
  { id: 3, name: "Nets", city: "Brooklyn", abbreviation: "BKN" },
  { id: 4, name: "Hornets", city: "Charlotte", abbreviation: "CHA" },
  { id: 5, name: "Bulls", city: "Chicago", abbreviation: "CHI" },
  { id: 6, name: "Cavaliers", city: "Cleveland", abbreviation: "CLE" },
  { id: 7, name: "Mavericks", city: "Dallas", abbreviation: "DAL" },
  { id: 8, name: "Nuggets", city: "Denver", abbreviation: "DEN" },
  { id: 9, name: "Pistons", city: "Detroit", abbreviation: "DET" },
  { id: 10, name: "Warriors", city: "Golden State", abbreviation: "GSW" },
  { id: 11, name: "Rockets", city: "Houston", abbreviation: "HOU" },
  { id: 12, name: "Pacers", city: "Indiana", abbreviation: "IND" },
  { id: 13, name: "Clippers", city: "LA", abbreviation: "LAC" },
  { id: 14, name: "Lakers", city: "Los Angeles", abbreviation: "LAL" },
  { id: 15, name: "Grizzlies", city: "Memphis", abbreviation: "MEM" },
  { id: 16, name: "Heat", city: "Miami", abbreviation: "MIA" },
  { id: 17, name: "Bucks", city: "Milwaukee", abbreviation: "MIL" },
  { id: 18, name: "Timberwolves", city: "Minnesota", abbreviation: "MIN" },
  { id: 19, name: "Pelicans", city: "New Orleans", abbreviation: "NOP" },
  { id: 20, name: "Knicks", city: "New York", abbreviation: "NYK" },
  { id: 21, name: "Thunder", city: "Oklahoma City", abbreviation: "OKC" },
  { id: 22, name: "Magic", city: "Orlando", abbreviation: "ORL" },
  { id: 23, name: "76ers", city: "Philadelphia", abbreviation: "PHI" },
  { id: 24, name: "Suns", city: "Phoenix", abbreviation: "PHX" },
  { id: 25, name: "Trail Blazers", city: "Portland", abbreviation: "POR" },
  { id: 26, name: "Kings", city: "Sacramento", abbreviation: "SAC" },
  { id: 27, name: "Spurs", city: "San Antonio", abbreviation: "SAS" },
  { id: 28, name: "Raptors", city: "Toronto", abbreviation: "TOR" },
  { id: 29, name: "Jazz", city: "Utah", abbreviation: "UTA" },
  { id: 30, name: "Wizards", city: "Washington", abbreviation: "WAS" },
];

interface Leader {
  player: {
    id: number;
    first_name: string;
    last_name: string;
    position: string;
    team: { abbreviation: string };
  };
  value: number;
  rank: number;
}

type LeaderCategory = "pts" | "reb" | "ast" | "stl" | "blk" | "fg_pct" | "fg3_pct" | "ft_pct";

const LEADER_LABELS: Record<LeaderCategory, string> = {
  pts: "PTS",
  reb: "REB",
  ast: "AST",
  stl: "STL",
  blk: "BLK",
  fg_pct: "FG%",
  fg3_pct: "3P%",
  ft_pct: "FT%",
};

const LEADER_CATEGORIES: LeaderCategory[] = ["pts", "reb", "ast", "stl", "blk", "fg_pct", "fg3_pct", "ft_pct"];

const STAT_PRECISION: Record<LeaderCategory, number> = {
  pts: 1, reb: 1, ast: 1, stl: 1, blk: 1, fg_pct: 1, fg3_pct: 1, ft_pct: 1,
};

const SPORT_ICONS: Record<Sport, string> = { NBA: "🏀", NCAAM: "🏀", NFL: "🏈", MLB: "⚾" };

interface OrganizedBracket {
  regions: Record<string, Record<number, NCAABBracketGame[]>>;
  finalFour: NCAABBracketGame[];
  championship: NCAABBracketGame[];
  rounds: number[];
  regionNames: string[];
}

function organizeBracket(games: NCAABBracketGame[]): OrganizedBracket {
  const regions: Record<string, Record<number, NCAABBracketGame[]>> = {};
  const finalFour: NCAABBracketGame[] = [];
  const championship: NCAABBracketGame[] = [];
  const roundSet = new Set<number>();
  const regionNameSet = new Set<string>();

  const regionNames_ = deriveRegionNames(games);

  for (const game of games) {
    roundSet.add(game.round);

    if (game.round >= 5) {
      if (game.round === 6) championship.push(game);
      else finalFour.push(game);
      continue;
    }

    let regionLabel: string;
    if (game.bracket_location !== null && game.bracket_location !== undefined) {
      if (game.round === 0) {
        regionLabel = "First Four";
      } else {
        const perRegion = Math.pow(2, 4 - game.round);
        const regionIdx = Math.ceil(game.bracket_location / perRegion);
        regionLabel = regionNames_[regionIdx] ?? `Region ${regionIdx}`;
      }
    } else {
      regionLabel = game.region_label ?? "Unknown";
    }

    regionNameSet.add(regionLabel);
    if (!regions[regionLabel]) regions[regionLabel] = {};
    if (!regions[regionLabel][game.round]) regions[regionLabel][game.round] = [];
    regions[regionLabel][game.round].push(game);
  }

  return {
    regions,
    finalFour,
    championship,
    rounds: Array.from(roundSet).sort((a, b) => a - b),
    regionNames: Array.from(regionNameSet),
  };
}

export default function HomePage() {
  const router = useRouter();
  const { status } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Use the same sport state as PlayerSearch so they stay in sync
  const searchNcaamPlayers = useAction(api.ncaab.searchPlayers);
  const { selectedSport, setSelectedSport } = usePlayerSearch({ ncaamSearchFn: searchNcaamPlayers });

  // League leaders state
  const [leaders, setLeaders] = useState<Record<string, Leader[]>>({});
  const [leaderPlayers, setLeaderPlayers] = useState<Record<string, Player>>({});
  const [selectedCategory, setSelectedCategory] = useState<LeaderCategory>("pts");
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(true);

  // NCAAM bracket state
  const [bracketGames, setBracketGames] = useState<NCAABBracketGame[]>([]);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);

  const getLeaders = useAction(api.nba.getLeaders);
  const getBracket = useAction(api.ncaab.getBracket);

  const handleLeaderClick = useCallback((leader: Leader) => {
    const name = `${leader.player.first_name} ${leader.player.last_name}`;
    const player = leaderPlayers[name];
    if (player) {
      setSelectedPlayer(player);
    } else {
      setSelectedPlayer({
        id: String(leader.player.id),
        name,
        sport: "NBA",
        team: leader.player.team?.abbreviation ?? "N/A",
        position: leader.player.position || "N/A",
        number: "0",
      });
    }
  }, [leaderPlayers]);

  const fetchLeaders = useCallback(async () => {
    setIsLoadingLeaders(true);
    try {
      const categoryResults = await Promise.all(
        LEADER_CATEGORIES.map(async (category) => {
          const result = await getLeaders({ statType: category });
          return [category, (result.leaders as Leader[]).slice(0, 15)] as const;
        })
      );
      const allLeaders = Object.fromEntries(categoryResults) as Record<LeaderCategory, Leader[]>;
      setLeaders(allLeaders);

      const uniqueNames = new Set<string>();
      Object.values(allLeaders).flat().forEach(l => {
        uniqueNames.add(`${l.player.first_name} ${l.player.last_name}`);
      });
      try {
        const res = await fetch(`/api/players/photos?names=${encodeURIComponent([...uniqueNames].join(","))}`);
        if (res.ok) {
          setLeaderPlayers(await res.json());
        }
      } catch {
        // Non-critical
      }
    } catch (err) {
      console.error("Failed to fetch leaders:", err);
    } finally {
      setIsLoadingLeaders(false);
    }
  }, [getLeaders]);

  useEffect(() => {
    if (status === "onboarding") {
      router.push("/onboarding");
    }
  }, [status, router]);

  const fetchBracket = useCallback(async () => {
    setBracketLoading(true);
    setBracketError(null);
    try {
      const result = await getBracket({});
      setBracketGames(result.games as NCAABBracketGame[]);
    } catch (err: any) {
      console.error("Failed to fetch bracket:", err);
      setBracketError(err.message || "Failed to load bracket");
    } finally {
      setBracketLoading(false);
    }
  }, [getBracket]);

  useEffect(() => {
    if (status !== "loading" && status !== "onboarding") {
      fetchLeaders();
    }
  }, [status]);

  useEffect(() => {
    if (selectedSport === "NCAAM" && bracketGames.length === 0 && !bracketLoading) {
      fetchBracket();
    }
  }, [selectedSport]);

  const bracket = useMemo(() => organizeBracket(bracketGames), [bracketGames]);

  if (status === "loading" || status === "onboarding") {
    return (
      <main className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const currentLeaders = leaders[selectedCategory] || [];
  const formatLeaderValue = (value: number, statType: LeaderCategory): string => {
    const precision = STAT_PRECISION[statType] ?? 1;
    if (statType.includes("pct")) {
      return `${(value * 100).toFixed(precision)}%`;
    }
    return value.toFixed(precision);
  };

  return (
    <main className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 via-background-primary to-background-primary overflow-hidden" />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-center bg-gradient-to-r from-accent to-green-400 bg-clip-text text-transparent">
            StatCheck
          </h1>

          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-xl mx-auto text-center">
            Search players, view stats, and create your own lists
          </p>

          {/* Sport Selector - prominent in hero */}
          <div className="flex justify-center mb-8">
            <div className="flex gap-1 p-1 bg-background-secondary/80 backdrop-blur rounded-xl">
              {(["NBA", "NCAAM", "NFL", "MLB"] as Sport[]).map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    selectedSport === sport
                      ? "bg-accent text-white shadow-lg shadow-green-500/20"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span>{SPORT_ICONS[sport]}</span>
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative z-50">
            <PlayerSearch onPlayerSelect={setSelectedPlayer} selectedSport={selectedSport} />
          </div>

          {/* Create List CTA */}
          <div className="mt-8 text-center">
            <a
              href="/lists"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-accent to-green-600 hover:from-green-500 hover:to-green-700 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-green-500/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your List
            </a>
          </div>
        </div>
      </div>

      {/* ═══════ NBA Content ═══════ */}
      {selectedSport === "NBA" && (
        <div className="max-w-5xl mx-auto px-6 pb-12">
          {/* Header with action buttons */}
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-text-primary">NBA</h2>
            <div className="flex-1 h-px bg-white/10" />
            <Link
              href="/scores?sport=NBA"
              className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
            >
              <span>🏀</span> Scores
            </Link>
            <Link
              href="/standings"
              className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
            >
              <span>🏆</span> Standings
            </Link>
          </div>

          {/* League Leaders */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-3">League Leaders</h3>

            <div className="overflow-x-auto mb-4">
              <div className="inline-flex gap-1 p-1 bg-background-secondary rounded-xl whitespace-nowrap">
                {LEADER_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === cat
                        ? "bg-accent text-white"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {LEADER_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingLeaders ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : currentLeaders.length > 0 ? (
              <div className="bg-card rounded-xl overflow-hidden">
                {currentLeaders.map((leader, index) => (
                  <div
                    key={leader.player.id}
                    onClick={() => handleLeaderClick(leader)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className={`w-6 text-center font-bold text-sm ${
                      index < 3 ? "text-accent" : "text-text-muted"
                    }`}>
                      {index + 1}
                    </span>
                    {(() => {
                      const fullName = `${leader.player.first_name} ${leader.player.last_name}`;
                      const photoUrl = leaderPlayers[fullName]?.photoUrl;
                      return photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={fullName}
                          className="w-8 h-8 rounded-full object-cover bg-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-text-muted">
                          {leader.player.first_name[0]}{leader.player.last_name[0]}
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary text-sm truncate">
                        {leader.player.first_name} {leader.player.last_name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {leader.player.team?.abbreviation ?? "FA"} · {leader.player.position}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-text-primary tabular-nums">
                      {formatLeaderValue(leader.value, selectedCategory)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl p-6 text-center text-text-muted text-sm">
                No leader data available
              </div>
            )}
          </div>

          {/* NBA Teams */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-3">Teams</h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 md:gap-3">
              {NBA_TEAMS.map((team) => (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-xl hover:bg-card hover:scale-105 transition-all group"
                  title={`${team.city} ${team.name}`}
                >
                  <img
                    src={getNBATeamLogoUrl(team.abbreviation)}
                    alt={team.abbreviation}
                    className="w-10 h-10 md:w-12 md:h-12 object-contain"
                  />
                  <span className="text-[10px] md:text-xs font-medium text-text-muted group-hover:text-text-primary transition-colors">
                    {team.abbreviation}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ NCAAM Content ═══════ */}
      {selectedSport === "NCAAM" && (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-text-primary">NCAAM Bracket</h2>
            <div className="flex-1 h-px bg-white/10" />
            <Link
              href="/scores?sport=NCAAM"
              className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
            >
              <span>🏀</span> Scores
            </Link>
            <Link
              href="/standings?sport=NCAAM"
              className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
            >
              <span>🏆</span> Standings
            </Link>
            <Link
              href="/bracket"
              className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
            >
              <span>🏀</span> Bracket
            </Link>
          </div>

          {bracketLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bracketError ? (
            <div className="bg-card rounded-xl p-12 text-center">
              <p className="text-text-secondary mb-4">{bracketError}</p>
              <button
                onClick={fetchBracket}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : bracketGames.length === 0 ? (
            <div className="bg-card rounded-xl p-12 text-center">
              <span className="text-4xl mb-4 block">🏀</span>
              <h3 className="text-lg font-semibold text-text-primary mb-2">No Bracket Data</h3>
              <p className="text-text-secondary text-sm">Bracket data is not available yet.</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <FullBracket bracket={bracket} />
              </div>
              <div className="lg:hidden">
                <RoundView bracket={bracket} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ NFL Content ═══════ */}
      {selectedSport === "NFL" && (
        <div className="max-w-5xl mx-auto px-6 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-text-primary">NFL</h2>
            <div className="flex-1 h-px bg-white/10" />
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-text-muted rounded-lg text-sm font-semibold">
              <span>🏈</span> Scores — Soon
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-text-muted rounded-lg text-sm font-semibold">
              <span>🏆</span> Standings — Soon
            </span>
          </div>
          <div className="bg-card rounded-xl p-12 text-center">
            <span className="text-4xl mb-4 block">🏈</span>
            <h3 className="text-lg font-semibold text-text-primary mb-2">NFL Coming Soon</h3>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              NFL stats, scores, league leaders, and team pages are on the way. You can already search NFL players above.
            </p>
          </div>
        </div>
      )}

      {/* ═══════ MLB Content ═══════ */}
      {selectedSport === "MLB" && (
        <div className="max-w-5xl mx-auto px-6 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-text-primary">MLB</h2>
            <div className="flex-1 h-px bg-white/10" />
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-text-muted rounded-lg text-sm font-semibold">
              <span>⚾</span> Scores — Soon
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/5 text-text-muted rounded-lg text-sm font-semibold">
              <span>🏆</span> Standings — Soon
            </span>
          </div>
          <div className="bg-card rounded-xl p-12 text-center">
            <span className="text-4xl mb-4 block">⚾</span>
            <h3 className="text-lg font-semibold text-text-primary mb-2">MLB Coming Soon</h3>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              MLB stats, scores, league leaders, and team pages are on the way. You can already search MLB players above.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-text-muted">
          <div className="flex justify-center gap-6 text-sm mb-4">
            <Link href="/support" className="hover:text-text-primary transition-colors">Support</Link>
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms</Link>
          </div>
          <p>&copy; 2025 StatCheck. Built for sports fans.</p>
        </div>
      </footer>

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </main>
  );
}

