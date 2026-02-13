"use client";

import { useState, useCallback, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@convex/_generated/api";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";

type Sport = "NBA" | "NFL" | "MLB";
type Conference = "East" | "West";

interface Standing {
  team: {
    id: number;
    full_name: string;
    abbreviation: string;
    city: string;
    name: string;
    conference: string;
    division: string;
  };
  season: number;
  wins: number;
  losses: number;
  conference_rank: number;
  conference_record: string;
  division_rank: number;
  division_record: string;
  home_record: string;
  road_record: string;
}

function StandingsTable({
  standings,
  conference,
  onTeamClick,
}: {
  standings: Standing[];
  conference: Conference;
  onTeamClick: (teamId: number) => void;
}) {
  const conferenceStandings = standings
    .filter((s) => s.team.conference === conference)
    .sort((a, b) => a.conference_rank - b.conference_rank);

  const getWinPct = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? wins / total : 0;
  };

  const getGamesBehind = (standing: Standing, index: number) => {
    if (index === 0) return "-";
    const leader = conferenceStandings[0];
    const leaderWinDiff = leader.wins - standing.wins;
    const leaderLossDiff = standing.losses - leader.losses;
    const gb = (leaderWinDiff + leaderLossDiff) / 2;
    return gb.toFixed(1);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-background-secondary">
            <th className="w-8 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              #
            </th>
            <th className="py-2 px-2 text-left text-xs font-medium text-text-secondary">
              Team
            </th>
            <th className="w-10 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              W
            </th>
            <th className="w-10 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              L
            </th>
            <th className="w-14 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              PCT
            </th>
            <th className="w-12 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              GB
            </th>
          </tr>
        </thead>
        <tbody>
          {conferenceStandings.map((standing, index) => {
            const isPlayIn = index >= 6 && index < 10;
            const isEliminated = index >= 10;

            return (
              <tr
                key={standing.team.id}
                onClick={() => onTeamClick(standing.team.id)}
                className={`border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                  isPlayIn ? "bg-purple-500/5" : ""
                }`}
              >
                <td
                  className={`py-2.5 px-2 text-center font-semibold ${
                    isEliminated ? "text-text-muted" : "text-text-primary"
                  }`}
                >
                  {index + 1}
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={getNBATeamLogoUrl(standing.team.abbreviation)}
                      alt={standing.team.abbreviation}
                      className="w-7 h-7 object-contain"
                    />
                    <div>
                      <p className="font-semibold text-text-primary">
                        {standing.team.abbreviation}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {standing.team.city}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-center text-text-primary">
                  {standing.wins}
                </td>
                <td className="py-2.5 px-2 text-center text-text-secondary">
                  {standing.losses}
                </td>
                <td className="py-2.5 px-2 text-center text-text-primary tabular-nums">
                  {getWinPct(standing.wins, standing.losses)
                    .toFixed(3)
                    .replace("0.", ".")}
                </td>
                <td className="py-2.5 px-2 text-center text-text-secondary tabular-nums">
                  {getGamesBehind(standing, index)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ComingSoonSport({ sport }: { sport: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center mb-4">
        {sport === "NFL" ? (
          <svg className="w-9 h-9 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
            <line x1="12" y1="8.5" x2="12" y2="15.5" />
            <line x1="10.5" y1="10" x2="13.5" y2="10" />
            <line x1="10.5" y1="12" x2="13.5" y2="12" />
            <line x1="10.5" y1="14" x2="13.5" y2="14" />
          </svg>
        ) : (
          <svg className="w-9 h-9 text-accent-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M5.5 7.5c1.5 1.5 1.5 3.5 0 5s-1.5 3.5 0 5" />
            <path d="M18.5 6.5c-1.5 1.5-1.5 3.5 0 5s1.5 3.5 0 5" />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-bold text-text-primary mb-2">{sport} Standings</h3>
      <p className="text-text-secondary mb-1">Coming Soon</p>
      <p className="text-sm text-text-muted max-w-xs">
        {sport} standings and rankings are on the way. Stay tuned!
      </p>
    </div>
  );
}

export default function StandingsPage() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState<Sport>("NBA");
  const [selectedConference, setSelectedConference] =
    useState<Conference>("East");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const getStandings = useAction(api.nba.getStandings);
  const currentSeason = useQuery(api.nba.getCurrentSeason);

  const fetchStandings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getStandings({});
      setStandings(result.standings as Standing[]);
      setCachedAt(result.cachedAt);
    } catch (err: any) {
      console.error("Failed to fetch standings:", err);
      setError(err.message || "Failed to load standings");
    } finally {
      setIsLoading(false);
    }
  }, [getStandings]);

  useEffect(() => {
    if (selectedSport === "NBA") {
      fetchStandings();
    }
  }, [selectedSport]);

  const handleTeamClick = useCallback(
    (teamId: number) => {
      router.push(`/team/${teamId}`);
    },
    [router]
  );

  const seasonLabel = currentSeason
    ? `${currentSeason}-${(currentSeason + 1).toString().slice(-2)}`
    : "";

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">
          Standings
        </h1>

        {/* Sport Tabs */}
        <div className="flex gap-1 p-1 bg-background-secondary rounded-xl mb-6">
          {(["NBA", "NFL", "MLB"] as Sport[]).map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                selectedSport === sport
                  ? "bg-accent-purple text-white shadow-lg shadow-purple-500/20"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {sport}
              {sport !== "NBA" && (
                <span className={`ml-1.5 text-[10px] font-medium uppercase ${
                  selectedSport === sport ? "text-white/70" : "text-text-muted"
                }`}>
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>

        {/* NFL / MLB Coming Soon */}
        {selectedSport !== "NBA" ? (
          <ComingSoonSport sport={selectedSport} />
        ) : (
          <>
            {seasonLabel && (
              <p className="text-sm text-text-secondary mb-4">
                {seasonLabel} Season
              </p>
            )}

            {/* Conference Selector */}
            <div className="flex gap-2 mb-6">
              {(["East", "West"] as Conference[]).map((conf) => (
                <button
                  key={conf}
                  onClick={() => setSelectedConference(conf)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedConference === conf
                      ? "bg-accent-purple text-white"
                      : "bg-background-secondary text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {conf === "East" ? "Eastern" : "Western"}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-text-secondary">Playoff spot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-purple" />
                <span className="text-xs text-text-secondary">Play-in (7-10)</span>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg
                  className="w-12 h-12 text-red-500 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-text-secondary mb-4">{error}</p>
                <button
                  onClick={fetchStandings}
                  className="px-4 py-2 bg-accent-purple text-white rounded-lg text-sm font-medium hover:bg-purple-500 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-xl overflow-hidden">
                <StandingsTable
                  standings={standings}
                  conference={selectedConference}
                  onTeamClick={handleTeamClick}
                />
              </div>
            )}

            {/* Cache info */}
            {cachedAt && !isLoading && (
              <p className="text-xs text-text-muted text-center mt-4">
                Updated {new Date(cachedAt).toLocaleTimeString()}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
