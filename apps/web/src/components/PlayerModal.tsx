"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Player } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { AddLinkModal } from "./AddLinkModal";
import { PlayerModalTabs, type PlayerModalTab } from "./PlayerModalTabs";
import {
  AdvancedStatsSection,
  type AdvancedStats,
} from "./AdvancedStatsSection";

type PlayerModalProps = {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
};

interface SeasonStats {
  games_played: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
}

interface ContractInfo {
  season: number;
  amount: number;
}

interface InjuryInfo {
  status: string;
  description: string;
  return_date: string | null;
}

function formatCurrency(amount: number) {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function getInjuryStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes("out")) return "bg-red-500/20 text-red-400";
  if (s.includes("doubtful")) return "bg-red-500/10 text-red-300";
  if (s.includes("questionable")) return "bg-yellow-500/20 text-yellow-400";
  if (s.includes("probable") || s.includes("day-to-day"))
    return "bg-green-500/20 text-green-400";
  return "bg-gray-500/20 text-gray-400";
}

function formatPercentage(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  const normalized = value > 1 ? value : value * 100;
  return `${normalized.toFixed(1)}%`;
}

function formatAverage(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toFixed(1);
}

export function PlayerModal({ player, isOpen, onClose }: PlayerModalProps) {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  // Tab state
  const isNBA = player?.sport === "NBA";
  const isNCAAM = player?.sport === "NCAAM";
  const hasStats = isNBA || isNCAAM;
  const [activeTab, setActiveTab] = useState<PlayerModalTab>(
    hasStats ? "stats" : "links"
  );

  // Stats toggle
  const [showAdvanced, setShowAdvanced] = useState(false);

  // NBA stats state
  const [bdlPlayerId, setBdlPlayerId] = useState<number | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats | null>(
    null
  );
  const [isLoadingAdvanced, setIsLoadingAdvanced] = useState(false);
  const [advancedRequiresPro, setAdvancedRequiresPro] = useState(false);
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [contractsRequiresPro, setContractsRequiresPro] = useState(false);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [injury, setInjury] = useState<InjuryInfo | null>(null);
  const [injuriesRequiresPro, setInjuriesRequiresPro] = useState(false);
  const [isLoadingInjury, setIsLoadingInjury] = useState(false);

  // Query player links (receipts)
  const playerLinks = useQuery(
    api.playerLinks.getPlayerLinks,
    isAuthenticated && userId && player
      ? { userId, playerId: player.id }
      : "skip"
  );

  // Pro access
  const proAccess = useQuery(api.nba.checkProAccess);
  const isProUser = proAccess?.isProUser ?? false;

  // Mutations
  const addPlayerLink = useMutation(api.playerLinks.addPlayerLink);
  const deletePlayerLink = useMutation(api.playerLinks.deletePlayerLink);
  const createSharedPlayer = useMutation(api.sharedPlayers.createSharedPlayer);

  // NBA API actions
  const searchPlayerByName = useAction(api.nba.searchPlayerByName);
  const getPlayerStats = useAction(api.nba.getPlayerStats);
  const getAdvancedStatsAction = useAction(api.nba.getAdvancedStats);
  const getPlayerContract = useAction(api.nba.getPlayerContract);
  const getInjuries = useAction(api.nba.getInjuries);

  // NCAAM API action
  const getNcaamPlayerStats = useAction(api.ncaab.getPlayerStats);

  // Reset tab when player changes
  useEffect(() => {
    if (player) {
      const pHasStats = player.sport === "NBA" || player.sport === "NCAAM";
      setActiveTab(pHasStats ? "stats" : "links");
      setShowAdvanced(false);
      setPhotoFailed(false);
    }
  }, [player?.id]);

  // Fetch NBA data when modal opens for an NBA player
  const fetchNBAData = useCallback(async () => {
    if (!player || !isNBA) return;

    setIsLoadingStats(true);
    setIsLoadingContracts(true);
    setIsLoadingInjury(true);
    setSeasonStats(null);
    setContracts([]);
    setInjury(null);
    setBdlPlayerId(null);
    setAdvancedStats(null);
    setAdvancedRequiresPro(false);

    try {
      // Step 1: Find BDL player ID
      const searchResult = await searchPlayerByName({ name: player.name });
      if (!searchResult.playerId) {
        setIsLoadingStats(false);
        setIsLoadingContracts(false);
        setIsLoadingInjury(false);
        return;
      }

      const pId = searchResult.playerId;
      setBdlPlayerId(pId);

      // Step 2: Fetch basic stats (FREE)
      try {
        const statsResult = await getPlayerStats({ playerId: pId });
        if (statsResult.stats) {
          setSeasonStats(statsResult.stats as unknown as SeasonStats);
        }
      } catch {
        // Stats not available
      }
      setIsLoadingStats(false);

      // Step 3: Fetch advanced stats (PRO)
      try {
        setIsLoadingAdvanced(true);
        const advResult = await getAdvancedStatsAction({
          playerId: pId,
          playerName: player.name,
        });
        if (advResult.requiresPro) {
          setAdvancedRequiresPro(true);
        } else if (advResult.stats) {
          // Map BDL fields to our AdvancedStats interface
          const s = advResult.stats as any;
          setAdvancedStats({
            per: s.per,
            ts_pct: s.ts_pct,
            efg_pct: s.efg_pct,
            usg_pct: s.usg_pct,
            ast_pct: s.ast_pct,
            tov_pct: s.tov_pct,
            orb_pct: s.oreb_pct,
            drb_pct: s.dreb_pct,
            trb_pct: s.reb_pct,
            stl_pct: s.stl_pct,
            blk_pct: s.blk_pct,
          });
          setAdvancedRequiresPro(false);
        }
      } catch {
        // Advanced stats not available
      }
      setIsLoadingAdvanced(false);

      // Step 4: Fetch contracts (PRO)
      try {
        const contractResult = await getPlayerContract({ playerId: pId });
        if (contractResult.requiresPro) {
          setContractsRequiresPro(true);
        } else {
          const mapped = (contractResult.contracts as any[]).map((c) => ({
            season: c.season,
            amount: c.amount,
          }));
          setContracts(mapped);
          setContractsRequiresPro(false);
        }
      } catch {
        // Contracts not available
      }
      setIsLoadingContracts(false);

      // Step 5: Fetch injuries (PRO)
      try {
        const injuryResult = await getInjuries({
          teamId: searchResult.player?.team?.id,
        });
        if (injuryResult.requiresPro) {
          setInjuriesRequiresPro(true);
        } else {
          const playerInjury = (injuryResult.injuries as any[]).find(
            (i) =>
              i.player.first_name === searchResult.player?.first_name &&
              i.player.last_name === searchResult.player?.last_name
          );
          if (playerInjury) {
            setInjury({
              status: playerInjury.status,
              description: playerInjury.description,
              return_date: playerInjury.return_date,
            });
          }
          setInjuriesRequiresPro(false);
        }
      } catch {
        // Injuries not available
      }
      setIsLoadingInjury(false);
    } catch {
      setIsLoadingStats(false);
      setIsLoadingContracts(false);
      setIsLoadingInjury(false);
      setIsLoadingAdvanced(false);
    }
  }, [
    player,
    isNBA,
    searchPlayerByName,
    getPlayerStats,
    getAdvancedStatsAction,
    getPlayerContract,
    getInjuries,
  ]);

  // Fetch NCAAM data when modal opens for an NCAAM player
  const fetchNCAAMData = useCallback(async () => {
    if (!player || !isNCAAM) return;

    setIsLoadingStats(true);
    setSeasonStats(null);

    try {
      const result = await getNcaamPlayerStats({
        playerId: Number(player.id),
      });
      if (result.stats) {
        setSeasonStats({
          games_played: result.stats.games_played ?? 0,
          min: result.stats.min ?? "0",
          pts: result.stats.pts ?? 0,
          reb: result.stats.reb ?? 0,
          ast: result.stats.ast ?? 0,
          stl: result.stats.stl ?? 0,
          blk: result.stats.blk ?? 0,
          turnover: result.stats.turnover ?? 0,
          fg_pct: result.stats.fg_pct ?? 0,
          fg3_pct: result.stats.fg3_pct ?? 0,
          ft_pct: result.stats.ft_pct ?? 0,
          fgm: result.stats.fgm ?? 0,
          fga: result.stats.fga ?? 0,
          fg3m: result.stats.fg3m ?? 0,
          fg3a: result.stats.fg3a ?? 0,
          ftm: result.stats.ftm ?? 0,
          fta: result.stats.fta ?? 0,
        });
      }
    } catch {
      // Stats not available
    }
    setIsLoadingStats(false);
  }, [player, isNCAAM, getNcaamPlayerStats]);

  useEffect(() => {
    if (isOpen && player && isNBA) {
      fetchNBAData();
    }
    if (isOpen && player && isNCAAM) {
      fetchNCAAMData();
    }
    if (!isOpen) {
      setPhotoFailed(false);
      setSeasonStats(null);
      setContracts([]);
      setInjury(null);
      setBdlPlayerId(null);
      setContractsRequiresPro(false);
      setInjuriesRequiresPro(false);
      setAdvancedStats(null);
      setAdvancedRequiresPro(false);
      setShowAdvanced(false);
    }
  }, [isOpen, player?.id]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

  const isHallOfFame = player.hallOfFame === true;
  const displayTeam = player.team === "N/A" ? null : player.team;
  const displayPosition = player.position === "N/A" ? null : player.position;

  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSportsReference = () => {
    if (player.sportsReferenceUrl) {
      window.open(player.sportsReferenceUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleAddReceipt = async (url: string, title: string) => {
    if (!userId || !player) return;
    try {
      await addPlayerLink({
        userId,
        playerId: player.id,
        url,
        title,
      });
    } catch (error) {
      console.error("Failed to add receipt:", error);
    }
  };

  const handleDeleteReceipt = async (linkId: string) => {
    try {
      await deletePlayerLink({ linkId: linkId as any });
    } catch (error) {
      console.error("Failed to delete receipt:", error);
    }
  };

  const handleSharePlayer = async () => {
    if (!player) return;

    try {
      setIsSharing(true);

      const links = (playerLinks || []).map((link, index) => ({
        id: link._id,
        url: link.url,
        title: link.title,
        order: index,
      }));

      const { shareId } = await createSharedPlayer({
        playerId: player.id,
        name: player.name,
        sport: player.sport || "NFL",
        team: player.team,
        position: player.position,
        number: player.number || "",
        photoUrl: player.photoUrl,
        sportsReferenceUrl: player.sportsReferenceUrl,
        stats: player.stats,
        hallOfFame: player.hallOfFame,
        links,
      });

      const shareUrl = `https://www.statcheckapp.com/player/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (error) {
      console.error("Failed to share player:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const currentContract = contracts.find(
    (c) => c.season === new Date().getFullYear()
  );

  // ---- Tab Content Renderers ----

  const renderStatsTab = () => (
    <div>
      {/* Basic / Advanced Toggle — NBA only */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
          Season Stats
        </h3>
        {isNBA && (
          <div className="flex gap-0.5 p-0.5 bg-white/5 rounded-md">
            <button
              onClick={() => setShowAdvanced(false)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                !showAdvanced
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => {
                if (!isProUser && advancedRequiresPro) return;
                setShowAdvanced(true);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                showAdvanced
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Adv
              {advancedRequiresPro && (
                <svg
                  className="w-3 h-3 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {isLoadingStats ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : showAdvanced ? (
        advancedRequiresPro ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <svg
              className="w-8 h-8 text-text-muted mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-text-muted text-sm mb-1">Unlock Pro</p>
            <p className="text-text-muted text-xs">
              Advanced stats from Basketball Reference
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-4">
            <AdvancedStatsSection
              stats={advancedStats}
              isLoading={isLoadingAdvanced}
            />
          </div>
        )
      ) : seasonStats ? (
        <div className="bg-card rounded-xl p-4">
          {/* Main stats row */}
          <div className="grid grid-cols-4 gap-3 text-center mb-3">
            <div>
              <p className="text-lg font-bold text-text-primary">
                {formatAverage(seasonStats.pts)}
              </p>
              <p className="text-[10px] uppercase text-text-muted font-medium">
                PTS
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">
                {formatAverage(seasonStats.reb)}
              </p>
              <p className="text-[10px] uppercase text-text-muted font-medium">
                REB
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">
                {formatAverage(seasonStats.ast)}
              </p>
              <p className="text-[10px] uppercase text-text-muted font-medium">
                AST
              </p>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">
                {seasonStats.games_played}
              </p>
              <p className="text-[10px] uppercase text-text-muted font-medium">
                GP
              </p>
            </div>
          </div>
          {/* Secondary stats */}
          <div className="border-t border-white/5 pt-3 grid grid-cols-5 gap-2 text-center">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {formatAverage(seasonStats.stl)}
              </p>
              <p className="text-[10px] uppercase text-text-muted">STL</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {formatAverage(seasonStats.blk)}
              </p>
              <p className="text-[10px] uppercase text-text-muted">BLK</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {formatPercentage(seasonStats.fg_pct)}
              </p>
              <p className="text-[10px] uppercase text-text-muted">FG%</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {formatPercentage(seasonStats.fg3_pct)}
              </p>
              <p className="text-[10px] uppercase text-text-muted">3P%</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {formatPercentage(seasonStats.ft_pct)}
              </p>
              <p className="text-[10px] uppercase text-text-muted">FT%</p>
            </div>
          </div>
          {isNCAAM && (
            <div className="border-t border-white/5 mt-3 pt-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {seasonStats.min || "-"}
                </p>
                <p className="text-[10px] uppercase text-text-muted">MIN</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {formatAverage(seasonStats.turnover)}
                </p>
                <p className="text-[10px] uppercase text-text-muted">TO</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {seasonStats.fgm}/{seasonStats.fga}
                </p>
                <p className="text-[10px] uppercase text-text-muted">FGM/A</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {seasonStats.fg3m}/{seasonStats.fg3a}
                </p>
                <p className="text-[10px] uppercase text-text-muted">3PM/A</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 py-3 bg-card rounded-lg text-text-muted text-center text-sm">
          No stats available this season
        </div>
      )}
    </div>
  );

  const renderContractTab = () => (
    <div>
      {/* Injury Status */}
      {(injury || isLoadingInjury || injuriesRequiresPro) && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
              Injury Status
            </h3>
            <span className="bg-accent px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
              PRO
            </span>
          </div>
          {isLoadingInjury ? (
            <div className="flex justify-center py-3">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : injuriesRequiresPro ? (
            <div className="bg-card rounded-xl p-4 text-center">
              <svg
                className="w-8 h-8 text-text-muted mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-text-muted text-xs">
                Unlock Pro for injury reports
              </p>
            </div>
          ) : injury ? (
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold ${getInjuryStatusColor(injury.status)}`}
                >
                  {injury.status}
                </span>
              </div>
              {injury.description && (
                <p className="text-sm text-text-secondary">
                  {injury.description}
                </p>
              )}
              {injury.return_date && (
                <p className="text-xs text-text-muted mt-1">
                  Expected return: {injury.return_date}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Contract Info */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
            Contract
          </h3>
          <span className="bg-accent px-1.5 py-0.5 rounded text-[9px] font-bold text-white">
            PRO
          </span>
        </div>
        {isLoadingContracts ? (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contractsRequiresPro ? (
          <div className="bg-card rounded-xl p-4 text-center">
            <svg
              className="w-8 h-8 text-text-muted mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="text-text-muted text-xs">
              Unlock Pro for contract details
            </p>
          </div>
        ) : contracts.length > 0 ? (
          <div className="bg-card rounded-xl overflow-hidden">
            {contracts
              .sort((a, b) => a.season - b.season)
              .map((c) => (
                <div
                  key={c.season}
                  className={`flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-b-0 ${
                    c.season === new Date().getFullYear()
                      ? "bg-accent/5"
                      : ""
                  }`}
                >
                  <span className="text-sm text-text-secondary">
                    {c.season}-{(c.season + 1).toString().slice(-2)}
                  </span>
                  <span className="text-sm font-semibold text-text-primary tabular-nums">
                    {formatCurrency(c.amount)}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <div className="px-4 py-3 bg-card rounded-lg text-text-muted text-center text-sm">
            No contract data available
          </div>
        )}
      </div>
    </div>
  );

  const renderLinksTab = () => (
    <div>
      {/* Quick Links */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
          Quick Links
        </h3>
        {player.sportsReferenceUrl ? (
          <button
            onClick={handleSportsReference}
            className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-card-hover rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <div className="text-text-primary font-medium">
                Sports Reference
              </div>
              <div className="text-sm text-text-secondary">
                View full stats and history
              </div>
            </div>
            <svg
              className="w-5 h-5 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <div className="px-4 py-3 bg-card rounded-lg text-text-muted text-center">
            No external links available
          </div>
        )}
      </div>

      {/* Receipts Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
            Receipts
          </h3>
          {isAuthenticated && (
            <button
              onClick={() => setShowAddLink(true)}
              className="text-accent hover:text-green-400 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add
            </button>
          )}
        </div>

        {isAuthenticated ? (
          playerLinks && playerLinks.length > 0 ? (
            <div className="space-y-2">
              {playerLinks.map((link) => (
                <div
                  key={link._id}
                  className="flex items-center gap-3 px-4 py-3 bg-card hover:bg-card-hover rounded-lg group transition-colors"
                >
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-0"
                  >
                    <div className="text-text-primary font-medium truncate hover:text-accent transition-colors">
                      {link.title}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {link.url}
                    </div>
                  </a>
                  <button
                    onClick={() => handleDeleteReceipt(link._id)}
                    className="p-1.5 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete receipt"
                  >
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 bg-card rounded-lg text-text-muted text-center text-sm">
              No receipts yet. Add links to back up your takes!
            </div>
          )
        ) : (
          <button
            onClick={() => {
              onClose();
              router.push("/auth/signin");
            }}
            className="w-full px-4 py-3 bg-card hover:bg-card-hover rounded-lg text-text-secondary text-sm text-center transition-colors"
          >
            Sign in to add receipts
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isAuthenticated ? (
          <button
            onClick={() => {
              setShowAddedMessage(true);
              setTimeout(() => setShowAddedMessage(false), 2000);
            }}
            className="flex-1 py-3 bg-accent hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
          >
            {showAddedMessage ? "Coming soon!" : "Add to List"}
          </button>
        ) : (
          <button
            onClick={() => {
              onClose();
              router.push("/auth/signin");
            }}
            className="flex-1 py-3 bg-accent hover:bg-green-500 text-white font-semibold rounded-xl transition-colors"
          >
            Sign in to Add to List
          </button>
        )}

        <button
          onClick={handleSharePlayer}
          disabled={isSharing}
          className="px-4 py-3 bg-card hover:bg-card-hover border border-white/10 text-text-primary font-semibold rounded-xl transition-colors flex items-center gap-2"
          title="Share player card"
        >
          {isSharing ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : showCopiedMessage ? (
            <svg
              className="w-5 h-5 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          )}
          {showCopiedMessage ? "Copied!" : "Share"}
        </button>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "stats":
        return renderStatsTab();
      case "contract":
        return renderContractTab();
      case "links":
      default:
        return renderLinksTab();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background-secondary rounded-2xl shadow-2xl
          transform transition-all duration-200
          ${isHallOfFame ? "ring-2 ring-gold" : ""}
        `}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
        >
          <svg
            className="w-5 h-5 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header with gradient */}
        <div
          className={`
            relative px-6 pt-8 pb-6 rounded-t-2xl
            ${isHallOfFame ? "bg-gradient-to-b from-yellow-900/30 to-transparent" : "bg-gradient-to-b from-accent/20 to-transparent"}
          `}
        >
          {/* Injury Badge */}
          {injury && (
            <div className="absolute top-4 left-4">
              <span
                className={`px-2 py-1 rounded-lg text-xs font-bold ${getInjuryStatusColor(injury.status)}`}
              >
                {injury.status}
              </span>
            </div>
          )}

          {/* Player Photo */}
          <div className="flex justify-center mb-4">
            {player.photoUrl && !photoFailed ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                width={120}
                height={120}
                className={`
                  w-28 h-28 rounded-full object-cover
                  ${isHallOfFame ? "ring-4 ring-gold" : "ring-4 ring-accent/50"}
                `}
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div
                className={`
                  w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold
                  ${isHallOfFame ? "bg-yellow-900/30 text-gold ring-4 ring-gold" : "bg-accent/20 text-accent ring-4 ring-accent/50"}
                `}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Name */}
          <h2
            className={`
              text-2xl font-bold text-center
              ${isHallOfFame ? "text-gold" : "text-text-primary"}
            `}
          >
            {player.name}
          </h2>

          {/* Team & Position */}
          {(displayTeam || displayPosition) && (
            <p className="text-center text-text-secondary mt-1">
              {displayTeam && displayPosition
                ? `${displayTeam} · ${displayPosition}`
                : displayTeam || displayPosition}
            </p>
          )}

          {/* HOF Badge */}
          {isHallOfFame && (
            <div className="flex justify-center mt-3">
              <span className="px-3 py-1 bg-yellow-900/30 text-gold text-sm font-semibold rounded-full">
                Hall of Fame
              </span>
            </div>
          )}

          {/* Contract Badge */}
          {currentContract && (
            <div className="flex justify-center mt-2">
              <span className="px-3 py-1 bg-green-900/20 text-green-400 text-sm font-semibold rounded-full">
                {formatCurrency(currentContract.amount)}/yr
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 mb-4">
          <PlayerModalTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isNBA={!!isNBA}
            isNCAAM={!!isNCAAM}
          />
        </div>

        {/* Tab Content */}
        <div className="px-6 pb-6">{renderTabContent()}</div>
      </div>

      {/* Add Receipt Modal */}
      <AddLinkModal
        isOpen={showAddLink}
        onClose={() => setShowAddLink(false)}
        onSave={handleAddReceipt}
      />
    </div>
  );
}
