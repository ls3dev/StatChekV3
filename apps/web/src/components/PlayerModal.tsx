"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Player } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { AddLinkModal } from "./AddLinkModal";

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

export function PlayerModal({ player, isOpen, onClose }: PlayerModalProps) {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // NBA stats state
  const [bdlPlayerId, setBdlPlayerId] = useState<number | null>(null);
  const [seasonStats, setSeasonStats] = useState<SeasonStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
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

  // Mutations
  const addPlayerLink = useMutation(api.playerLinks.addPlayerLink);
  const deletePlayerLink = useMutation(api.playerLinks.deletePlayerLink);
  const createSharedPlayer = useMutation(api.sharedPlayers.createSharedPlayer);

  // NBA API actions
  const searchPlayerByName = useAction(api.nba.searchPlayerByName);
  const getPlayerStats = useAction(api.nba.getPlayerStats);
  const getPlayerContract = useAction(api.nba.getPlayerContract);
  const getInjuries = useAction(api.nba.getInjuries);

  const isNBA = player?.sport === "NBA";

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

      // Step 2: Fetch stats (FREE)
      try {
        const statsResult = await getPlayerStats({ playerId: pId });
        if (statsResult.stats) {
          setSeasonStats(statsResult.stats as unknown as SeasonStats);
        }
      } catch {
        // Stats not available
      }
      setIsLoadingStats(false);

      // Step 3: Fetch contracts (PRO)
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

      // Step 4: Fetch injuries (PRO) - check if this player is injured
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
    }
  }, [player, isNBA, searchPlayerByName, getPlayerStats, getPlayerContract, getInjuries]);

  useEffect(() => {
    if (isOpen && player && isNBA) {
      fetchNBAData();
    }
    if (!isOpen) {
      setSeasonStats(null);
      setContracts([]);
      setInjury(null);
      setBdlPlayerId(null);
      setContractsRequiresPro(false);
      setInjuriesRequiresPro(false);
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

      // Create shared player with current links
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

      // Copy to clipboard
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
          relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-background-secondary rounded-2xl shadow-2xl
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
            ${isHallOfFame ? "bg-gradient-to-b from-yellow-900/30 to-transparent" : "bg-gradient-to-b from-accent-purple/20 to-transparent"}
          `}
        >
          {/* Injury Badge */}
          {injury && (
            <div className="absolute top-4 left-4">
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getInjuryStatusColor(injury.status)}`}>
                {injury.status}
              </span>
            </div>
          )}

          {/* Player Photo */}
          <div className="flex justify-center mb-4">
            {player.photoUrl ? (
              <Image
                src={player.photoUrl}
                alt={player.name}
                width={120}
                height={120}
                className={`
                  w-28 h-28 rounded-full object-cover
                  ${isHallOfFame ? "ring-4 ring-gold" : "ring-4 ring-accent-purple/50"}
                `}
              />
            ) : (
              <div
                className={`
                  w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold
                  ${isHallOfFame ? "bg-yellow-900/30 text-gold ring-4 ring-gold" : "bg-accent-purple/20 text-accent-purple ring-4 ring-accent-purple/50"}
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

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Season Stats (NBA only, FREE) */}
          {isNBA && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
                Season Stats
              </h3>
              {isLoadingStats ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                </div>
              ) : seasonStats ? (
                <div className="bg-card rounded-xl p-4">
                  {/* Main stats row */}
                  <div className="grid grid-cols-4 gap-3 text-center mb-3">
                    <div>
                      <p className="text-lg font-bold text-text-primary">{seasonStats.pts.toFixed(1)}</p>
                      <p className="text-[10px] uppercase text-text-muted font-medium">PTS</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-primary">{seasonStats.reb.toFixed(1)}</p>
                      <p className="text-[10px] uppercase text-text-muted font-medium">REB</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-primary">{seasonStats.ast.toFixed(1)}</p>
                      <p className="text-[10px] uppercase text-text-muted font-medium">AST</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-primary">{seasonStats.games_played}</p>
                      <p className="text-[10px] uppercase text-text-muted font-medium">GP</p>
                    </div>
                  </div>
                  {/* Secondary stats */}
                  <div className="border-t border-white/5 pt-3 grid grid-cols-5 gap-2 text-center">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{seasonStats.stl.toFixed(1)}</p>
                      <p className="text-[10px] uppercase text-text-muted">STL</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{seasonStats.blk.toFixed(1)}</p>
                      <p className="text-[10px] uppercase text-text-muted">BLK</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{(seasonStats.fg_pct * 100).toFixed(1)}%</p>
                      <p className="text-[10px] uppercase text-text-muted">FG%</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{(seasonStats.fg3_pct * 100).toFixed(1)}%</p>
                      <p className="text-[10px] uppercase text-text-muted">3P%</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{(seasonStats.ft_pct * 100).toFixed(1)}%</p>
                      <p className="text-[10px] uppercase text-text-muted">FT%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 bg-card rounded-lg text-text-muted text-center text-sm">
                  No stats available this season
                </div>
              )}
            </div>
          )}

          {/* Injury Detail (NBA only, PRO) */}
          {isNBA && (injury || isLoadingInjury || injuriesRequiresPro) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                  Injury Status
                </h3>
                <span className="bg-accent-purple px-1.5 py-0.5 rounded text-[9px] font-bold text-white">PRO</span>
              </div>
              {isLoadingInjury ? (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                </div>
              ) : injuriesRequiresPro ? (
                <div className="bg-card rounded-xl p-4 text-center">
                  <svg className="w-8 h-8 text-text-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-text-muted text-xs">Unlock Pro for injury reports</p>
                </div>
              ) : injury ? (
                <div className="bg-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getInjuryStatusColor(injury.status)}`}>
                      {injury.status}
                    </span>
                  </div>
                  {injury.description && (
                    <p className="text-sm text-text-secondary">{injury.description}</p>
                  )}
                  {injury.return_date && (
                    <p className="text-xs text-text-muted mt-1">Expected return: {injury.return_date}</p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Contract Info (NBA only, PRO) */}
          {isNBA && (contracts.length > 0 || isLoadingContracts || contractsRequiresPro) && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                  Contract
                </h3>
                <span className="bg-accent-purple px-1.5 py-0.5 rounded text-[9px] font-bold text-white">PRO</span>
              </div>
              {isLoadingContracts ? (
                <div className="flex justify-center py-3">
                  <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                </div>
              ) : contractsRequiresPro ? (
                <div className="bg-card rounded-xl p-4 text-center">
                  <svg className="w-8 h-8 text-text-muted mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-text-muted text-xs">Unlock Pro for contract details</p>
                </div>
              ) : contracts.length > 0 ? (
                <div className="bg-card rounded-xl overflow-hidden">
                  {contracts
                    .sort((a, b) => a.season - b.season)
                    .map((c) => (
                      <div
                        key={c.season}
                        className={`flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-b-0 ${
                          c.season === new Date().getFullYear() ? "bg-accent-purple/5" : ""
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
              ) : null}
            </div>
          )}

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
                <div className="w-8 h-8 bg-accent-purple/20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-accent-purple"
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
                  className="text-accent-purple hover:text-purple-400 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
                      <div className="w-8 h-8 bg-accent-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0"
                      >
                        <div className="text-text-primary font-medium truncate hover:text-accent-purple transition-colors">
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
                        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
            {/* Add to List Button */}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  // TODO: Open add to list modal
                  setShowAddedMessage(true);
                  setTimeout(() => setShowAddedMessage(false), 2000);
                }}
                className="flex-1 py-3 bg-accent-purple hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
              >
                {showAddedMessage ? "Coming soon!" : "Add to List"}
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  router.push("/auth/signin");
                }}
                className="flex-1 py-3 bg-accent-purple hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
              >
                Sign in to Add to List
              </button>
            )}

            {/* Share Button */}
            <button
              onClick={handleSharePlayer}
              disabled={isSharing}
              className="px-4 py-3 bg-card hover:bg-card-hover border border-white/10 text-text-primary font-semibold rounded-xl transition-colors flex items-center gap-2"
              title="Share player card"
            >
              {isSharing ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : showCopiedMessage ? (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
              {showCopiedMessage ? "Copied!" : "Share"}
            </button>
          </div>
        </div>
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
