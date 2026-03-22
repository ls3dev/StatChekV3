"use client";

import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@convex/_generated/api";
import { getNBATeamLogoUrl } from "@/lib/nbaTeamLogos";
import { getNCAABTeamLogoUrl } from "@/lib/ncaabTeamLogos";
import type { NCAABStanding, NCAABRanking } from "@convex/lib/ncaabBracket";

type Sport = "NBA" | "NCAAM" | "NFL" | "MLB";
type Conference = "East" | "West";
type NCAAMView = "rankings" | "standings";

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

function NBAStandingsTable({
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
                  isPlayIn ? "bg-green-500/5" : ""
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

function NCAAMRankingsTable({ rankings }: { rankings: NCAABRanking[] }) {
  const apRankings = rankings
    .filter((r) => r.poll === "ap")
    .sort((a, b) => a.rank - b.rank);

  if (apRankings.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-text-muted text-sm">No AP rankings available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-background-secondary">
            <th className="w-10 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              Rank
            </th>
            <th className="py-2 px-2 text-left text-xs font-medium text-text-secondary">
              Team
            </th>
            <th className="w-16 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              Record
            </th>
            <th className="w-14 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              Points
            </th>
            <th className="w-14 py-2 px-2 text-center text-xs font-medium text-text-secondary">
              Trend
            </th>
          </tr>
        </thead>
        <tbody>
          {apRankings.map((ranking) => {
            const logo = getNCAABTeamLogoUrl(ranking.team.abbreviation);
            return (
              <tr
                key={ranking.team.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-2.5 px-2 text-center font-bold text-text-primary">
                  {ranking.rank}
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2.5">
                    {logo ? (
                      <img
                        src={logo}
                        alt={ranking.team.abbreviation}
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                        {ranking.rank}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-text-primary">
                        {ranking.team.full_name || ranking.team.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {ranking.team.abbreviation}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-center text-text-primary tabular-nums">
                  {ranking.record || "-"}
                </td>
                <td className="py-2.5 px-2 text-center text-text-secondary tabular-nums">
                  {ranking.points}
                </td>
                <td className="py-2.5 px-2 text-center">
                  {ranking.trend ? (
                    <span
                      className={`text-xs font-medium ${
                        ranking.trend.startsWith("+") || ranking.trend.startsWith("u")
                          ? "text-green-500"
                          : ranking.trend.startsWith("-") || ranking.trend.startsWith("d")
                            ? "text-red-500"
                            : "text-text-muted"
                      }`}
                    >
                      {ranking.trend}
                    </span>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function NCAAMConferenceStandings({
  standings,
}: {
  standings: NCAABStanding[];
}) {
  const conferences = useMemo(() => {
    const confMap = new Map<string, NCAABStanding[]>();
    for (const s of standings) {
      const confName = s.conference?.short_name || s.conference?.name || "Unknown";
      if (!confMap.has(confName)) confMap.set(confName, []);
      confMap.get(confName)!.push(s);
    }
    // Sort conferences alphabetically
    return Array.from(confMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [standings]);

  const [selectedConf, setSelectedConf] = useState<string>("");

  useEffect(() => {
    if (conferences.length > 0 && !selectedConf) {
      setSelectedConf(conferences[0][0]);
    }
  }, [conferences, selectedConf]);

  const confStandings = useMemo(() => {
    const entry = conferences.find(([name]) => name === selectedConf);
    if (!entry) return [];
    return entry[1].sort((a, b) => {
      // Sort by conference win pct desc, then overall wins desc
      const aConfPct = a.conference_win_percentage ?? 0;
      const bConfPct = b.conference_win_percentage ?? 0;
      if (bConfPct !== aConfPct) return bConfPct - aConfPct;
      return b.wins - a.wins;
    });
  }, [conferences, selectedConf]);

  if (conferences.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 text-center">
        <p className="text-text-muted text-sm">No conference standings available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Conference Selector */}
      <div className="mb-4">
        <select
          value={selectedConf}
          onChange={(e) => setSelectedConf(e.target.value)}
          className="w-full px-3 py-2 bg-background-secondary text-text-primary rounded-lg text-sm border border-white/10 focus:outline-none focus:border-accent"
        >
          {conferences.map(([name]) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

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
              <th className="w-16 py-2 px-2 text-center text-xs font-medium text-text-secondary">
                CONF
              </th>
              <th className="w-16 py-2 px-2 text-center text-xs font-medium text-text-secondary hidden sm:table-cell">
                HOME
              </th>
              <th className="w-16 py-2 px-2 text-center text-xs font-medium text-text-secondary hidden sm:table-cell">
                AWAY
              </th>
            </tr>
          </thead>
          <tbody>
            {confStandings.map((s, index) => {
              const logo = getNCAABTeamLogoUrl(s.team.abbreviation);
              const pct = s.win_percentage ?? (s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0);
              return (
                <tr
                  key={s.team.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2.5 px-2 text-center font-semibold text-text-primary">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2.5">
                      {logo ? (
                        <img
                          src={logo}
                          alt={s.team.abbreviation}
                          className="w-7 h-7 object-contain"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                          {(s.team.abbreviation || "?").slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-text-primary truncate max-w-[120px] sm:max-w-none">
                          {s.team.full_name || s.team.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center text-text-primary">
                    {s.wins}
                  </td>
                  <td className="py-2.5 px-2 text-center text-text-secondary">
                    {s.losses}
                  </td>
                  <td className="py-2.5 px-2 text-center text-text-primary tabular-nums">
                    {pct.toFixed(3).replace("0.", ".")}
                  </td>
                  <td className="py-2.5 px-2 text-center text-text-secondary tabular-nums">
                    {s.conference_record || `${s.conference_wins ?? 0}-${s.conference_losses ?? 0}`}
                  </td>
                  <td className="py-2.5 px-2 text-center text-text-secondary tabular-nums hidden sm:table-cell">
                    {s.home_record || "-"}
                  </td>
                  <td className="py-2.5 px-2 text-center text-text-secondary tabular-nums hidden sm:table-cell">
                    {s.away_record || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComingSoonSport({ sport }: { sport: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        {sport === "NFL" ? (
          <svg className="w-9 h-9 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-45 12 12)" />
            <line x1="12" y1="8.5" x2="12" y2="15.5" />
            <line x1="10.5" y1="10" x2="13.5" y2="10" />
            <line x1="10.5" y1="12" x2="13.5" y2="12" />
            <line x1="10.5" y1="14" x2="13.5" y2="14" />
          </svg>
        ) : (
          <svg className="w-9 h-9 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
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
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background-primary flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <StandingsContent />
    </Suspense>
  );
}

function StandingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sportParam = searchParams.get("sport");
  const initialSport: Sport =
    sportParam === "NBA" || sportParam === "NCAAM" || sportParam === "NFL" || sportParam === "MLB"
      ? sportParam
      : "NBA";

  const [selectedSport, setSelectedSport] = useState<Sport>(initialSport);
  const [selectedConference, setSelectedConference] = useState<Conference>("East");
  const [standings, setStandings] = useState<Standing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  // NCAAM state
  const [ncaamView, setNcaamView] = useState<NCAAMView>("rankings");
  const [ncaamStandings, setNcaamStandings] = useState<NCAABStanding[]>([]);
  const [ncaamRankings, setNcaamRankings] = useState<NCAABRanking[]>([]);
  const [ncaamLoading, setNcaamLoading] = useState(false);
  const [ncaamError, setNcaamError] = useState<string | null>(null);
  const [ncaamCachedAt, setNcaamCachedAt] = useState<number | null>(null);

  const getStandings = useAction(api.nba.getStandings);
  const getNcaamStandings = useAction(api.ncaab.getStandings);
  const getNcaamRankings = useAction(api.ncaab.getRankings);
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

  const fetchNcaamData = useCallback(async () => {
    setNcaamLoading(true);
    setNcaamError(null);
    try {
      const [standingsResult, rankingsResult] = await Promise.all([
        getNcaamStandings({}),
        getNcaamRankings({}),
      ]);
      setNcaamStandings(standingsResult.standings as NCAABStanding[]);
      setNcaamRankings(rankingsResult.rankings as NCAABRanking[]);
      setNcaamCachedAt(Math.max(standingsResult.cachedAt, rankingsResult.cachedAt));
    } catch (err: any) {
      console.error("Failed to fetch NCAAM data:", err);
      setNcaamError(err.message || "Failed to load NCAAM data");
    } finally {
      setNcaamLoading(false);
    }
  }, [getNcaamStandings, getNcaamRankings]);

  useEffect(() => {
    if (selectedSport === "NBA") {
      fetchStandings();
    } else if (selectedSport === "NCAAM") {
      fetchNcaamData();
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
        {/* Nav buttons */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Standings</h1>
          <div className="flex-1 h-px bg-white/10" />
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
          >
            Home
          </Link>
          <Link
            href={`/scores${selectedSport !== "NBA" ? `?sport=${selectedSport}` : ""}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-semibold transition-colors"
          >
            Scores
          </Link>
        </div>

        {/* Sport Tabs */}
        <div className="flex gap-1 p-1 bg-background-secondary rounded-xl mb-6">
          {(["NBA", "NCAAM", "NFL", "MLB"] as Sport[]).map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                selectedSport === sport
                  ? "bg-accent text-white shadow-lg shadow-green-500/20"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {sport}
              {sport !== "NBA" && sport !== "NCAAM" && (
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
        {selectedSport === "NFL" || selectedSport === "MLB" ? (
          <ComingSoonSport sport={selectedSport} />
        ) : selectedSport === "NCAAM" ? (
          <>
            {/* NCAAM Sub-view toggle */}
            <div className="flex gap-2 mb-6">
              {(["rankings", "standings"] as NCAAMView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setNcaamView(view)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    ncaamView === view
                      ? "bg-accent text-white"
                      : "bg-background-secondary text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {view === "rankings" ? "AP Top 25" : "Conference Standings"}
                </button>
              ))}
            </div>

            {ncaamLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : ncaamError ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-12 h-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-text-secondary mb-4">{ncaamError}</p>
                <button
                  onClick={fetchNcaamData}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-xl overflow-hidden">
                {ncaamView === "rankings" ? (
                  <NCAAMRankingsTable rankings={ncaamRankings} />
                ) : (
                  <NCAAMConferenceStandings standings={ncaamStandings} />
                )}
              </div>
            )}

            {ncaamCachedAt && !ncaamLoading && (
              <p className="text-xs text-text-muted text-center mt-4">
                Updated {new Date(ncaamCachedAt).toLocaleTimeString()}
              </p>
            )}
          </>
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
                      ? "bg-accent text-white"
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
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-xs text-text-secondary">Play-in (7-10)</span>
              </div>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-xl overflow-hidden">
                <NBAStandingsTable
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
