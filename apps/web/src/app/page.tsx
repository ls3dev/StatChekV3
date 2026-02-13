"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { PlayerSearch } from "@/components/PlayerSearch";
import { PlayerModal } from "@/components/PlayerModal";
import type { Player } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";

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

type LeaderCategory = "pts" | "reb" | "ast";

const LEADER_LABELS: Record<LeaderCategory, string> = {
  pts: "Points",
  reb: "Rebounds",
  ast: "Assists",
};

export default function HomePage() {
  const router = useRouter();
  const { status } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // League leaders state
  const [leaders, setLeaders] = useState<Record<string, Leader[]>>({});
  const [playerPhotos, setPlayerPhotos] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<LeaderCategory>("pts");
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(true);

  const getLeaders = useAction(api.nba.getLeaders);

  const fetchLeaders = useCallback(async () => {
    setIsLoadingLeaders(true);
    try {
      // Fetch all three categories in parallel
      const [ptsResult, rebResult, astResult] = await Promise.all([
        getLeaders({ statType: "pts" }),
        getLeaders({ statType: "reb" }),
        getLeaders({ statType: "ast" }),
      ]);
      const allLeaders = {
        pts: (ptsResult.leaders as Leader[]).slice(0, 5),
        reb: (rebResult.leaders as Leader[]).slice(0, 5),
        ast: (astResult.leaders as Leader[]).slice(0, 5),
      };
      setLeaders(allLeaders);

      // Fetch player photos
      const uniqueNames = new Set<string>();
      Object.values(allLeaders).flat().forEach(l => {
        uniqueNames.add(`${l.player.first_name} ${l.player.last_name}`);
      });
      try {
        const res = await fetch(`/api/players/photos?names=${encodeURIComponent([...uniqueNames].join(","))}`);
        if (res.ok) {
          setPlayerPhotos(await res.json());
        }
      } catch {
        // Photos are non-critical, silently fail
      }
    } catch (err) {
      console.error("Failed to fetch leaders:", err);
    } finally {
      setIsLoadingLeaders(false);
    }
  }, [getLeaders]);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (status === "onboarding") {
      router.push("/onboarding");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "loading" && status !== "onboarding") {
      fetchLeaders();
    }
  }, [status]);

  // Show loading while checking onboarding status
  if (status === "loading" || status === "onboarding") {
    return (
      <main className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const currentLeaders = leaders[selectedCategory] || [];

  return (
    <main className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <div className="relative">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-background-primary to-background-primary overflow-hidden" />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 z-10">
          {/* Logo / Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-center bg-gradient-to-r from-accent-purple to-purple-400 bg-clip-text text-transparent">
            StatCheck
          </h1>

          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-xl mx-auto text-center">
            Search players, view stats, and create your own lists
          </p>

          {/* Search */}
          <div className="relative z-50">
            <PlayerSearch onPlayerSelect={setSelectedPlayer} />
          </div>

          {/* Create List CTA */}
          <div className="mt-8 text-center">
            <a
              href="/lists"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-500 hover:to-purple-700 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-purple-500/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your List
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <QuickActionCard icon="📋" title="My Lists" href="/lists" />
          <QuickActionCard icon="🏀" title="NBA Scores" href="/scores" />
          <QuickActionCard icon="🏆" title="Standings" href="/standings" />
          <QuickActionCard icon="⚔️" title="VS Compare" href="/vs" />
        </div>
      </div>

      {/* Season League Leaders */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">
            NBA League Leaders
          </h2>
          <Link
            href="/standings"
            className="text-sm text-accent-purple hover:text-purple-400 transition-colors"
          >
            View Standings
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 p-1 bg-background-secondary rounded-xl mb-4 max-w-xs">
          {(["pts", "reb", "ast"] as LeaderCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-accent-purple text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {LEADER_LABELS[cat]}
            </button>
          ))}
        </div>

        {isLoadingLeaders ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentLeaders.length > 0 ? (
          <div className="bg-card rounded-xl overflow-hidden">
            {currentLeaders.map((leader, index) => (
              <div
                key={leader.player.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
              >
                <span className={`w-6 text-center font-bold text-sm ${
                  index === 0 ? "text-accent-purple" : "text-text-muted"
                }`}>
                  {index + 1}
                </span>
                {(() => {
                  const fullName = `${leader.player.first_name} ${leader.player.last_name}`;
                  const photoUrl = playerPhotos[fullName];
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
                  {leader.value.toFixed(1)}
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
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <h2 className="text-xl font-bold text-text-primary mb-4">
          NBA Teams
        </h2>
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

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-text-muted">
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

function QuickActionCard({
  icon,
  title,
  href,
}: {
  icon: string;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 p-4 md:p-5 rounded-xl transition-all text-center bg-card hover:bg-card/80 hover:scale-105 text-text-primary"
    >
      <span className="text-2xl md:text-3xl">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </Link>
  );
}
