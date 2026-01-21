"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuthContext } from "@/context/AuthContext";
import { useListsContext } from "@/context/ListsContext";
import { PlayerSearch } from "@/components/PlayerSearch";
import { PlayerModal } from "@/components/PlayerModal";
import { AddLinkModal } from "@/components/AddLinkModal";
import { AgendaMode } from "@/components/list-modes/AgendaMode";
import { VSMode } from "@/components/list-modes/VSMode";
import { RankingMode } from "@/components/list-modes/RankingMode";
import type { Player, PlayerListItem } from "@/lib/types";

type PlayerWithData = PlayerListItem & { player: Player };

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const autoShareTriggered = useRef(false);
  const createSharedListMutation = useMutation(api.sharedLists.createSharedList);
  const {
    getListById,
    isLoaded,
    addPlayerToList,
    removePlayerFromList,
    reorderPlayersInList,
    addLinkToList,
    removeLinkFromList,
    updateList,
  } = useListsContext();

  const list = getListById(id);

  const [playersWithData, setPlayersWithData] = useState<PlayerWithData[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Fetch player data for all player IDs in the list
  const fetchPlayerData = useCallback(async () => {
    if (!list?.players || list.players.length === 0) {
      setPlayersWithData([]);
      setLoadingPlayers(false);
      return;
    }

    setLoadingPlayers(true);
    try {
      const playerPromises = list.players.map(async (item) => {
        try {
          // Include sport param to scope lookup and avoid ID collision across sports
          const url = `/api/players/${item.playerId}${item.sport ? `?sport=${item.sport}` : ""}`;
          const res = await fetch(url);
          if (!res.ok) return null;
          const player: Player = await res.json();
          return { ...item, player };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(playerPromises);
      const validPlayers = results.filter(
        (p): p is PlayerWithData => p !== null
      );
      setPlayersWithData(validPlayers);
    } catch (error) {
      console.error("Error fetching player data:", error);
    } finally {
      setLoadingPlayers(false);
    }
  }, [list?.players]);

  useEffect(() => {
    if (isLoaded && list) {
      fetchPlayerData();
    }
  }, [isLoaded, list, fetchPlayerData]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  // Update edit state when list changes
  useEffect(() => {
    if (list) {
      setEditName(list.name);
      setEditDescription(list.description || "");
    }
  }, [list]);

  // Auto-trigger share if ?share=true is in URL (from ListCard redirect)
  useEffect(() => {
    if (
      searchParams.get("share") === "true" &&
      !autoShareTriggered.current &&
      !loadingPlayers &&
      playersWithData.length > 0 &&
      list
    ) {
      autoShareTriggered.current = true;
      // Remove the query param from URL
      router.replace(`/lists/${id}`, { scroll: false });
      // Trigger share after a brief delay to ensure everything is ready
      setTimeout(() => {
        handleShare();
      }, 100);
    }
  }, [searchParams, loadingPlayers, playersWithData, list, id, router]);

  if (authLoading || !isLoaded) {
    return (
      <main className="min-h-screen bg-background-primary">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!list) {
    return (
      <main className="min-h-screen bg-background-primary">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center py-24">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              List not found
            </h1>
            <p className="text-text-secondary mb-6">
              This list doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link
              href="/lists"
              className="text-accent-purple hover:underline font-medium"
            >
              Back to My Lists
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const handleSaveEdit = async () => {
    if (editName.trim()) {
      await updateList(list.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    }
  };

  const handleAddPlayer = async (player: Player) => {
    const success = await addPlayerToList(list.id, player.id, player.sport);
    if (success) {
      setShowAddPlayer(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    await removePlayerFromList(list.id, playerId);
  };

  const handleReorderPlayers = async (newOrder: PlayerWithData[]) => {
    // Update local state immediately for responsiveness
    setPlayersWithData(newOrder);

    // Update backend with the new order (preserve sport field)
    const reorderedItems: PlayerListItem[] = newOrder.map((item, index) => ({
      playerId: item.playerId,
      sport: item.sport,
      order: index,
      addedAt: item.addedAt,
    }));
    await reorderPlayersInList(list.id, reorderedItems);
  };

  const handleAddLink = async (url: string, title: string) => {
    await addLinkToList(list.id, url, title);
  };

  const handleRemoveLink = async (linkId: string) => {
    await removeLinkFromList(list.id, linkId);
  };

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      // Create shared list snapshot with denormalized player data
      const result = await createSharedListMutation({
        name: list.name,
        description: list.description,
        players: playersWithData.map((p, index) => ({
          playerId: p.playerId,
          order: index,
          name: p.player.name,
          team: p.player.team,
          position: p.player.position,
          photoUrl: p.player.photoUrl,
          sportsReferenceUrl: p.player.sportsReferenceUrl,
          hallOfFame: p.player.hallOfFame,
        })),
        links: (list.links || []).map((link, index) => ({
          id: link.id,
          url: link.url,
          title: link.title,
          order: index,
        })),
        originalCreatedAt: list.createdAt,
        originalUpdatedAt: list.updatedAt,
        sharedByName: user?.name,
      });

      const shareUrl = `${window.location.origin}/list/${result.shareId}`;

      // Try to copy to clipboard with fallback
      let copySuccess = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          copySuccess = true;
        }
      } catch (clipboardError) {
        console.warn("Clipboard API failed:", clipboardError);
      }

      // Fallback: use textarea method
      if (!copySuccess) {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          copySuccess = document.execCommand("copy");
        } catch (execError) {
          console.warn("execCommand copy failed:", execError);
        }
        document.body.removeChild(textArea);
      }

      if (copySuccess) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Last resort: prompt user to copy manually
        window.prompt("Copy this share link:", shareUrl);
      }
    } catch (error) {
      console.error("Error creating shared list:", error);
    } finally {
      setIsSharing(false);
    }
  };

  // Determine which mode to show based on player count
  const playerCount = playersWithData.length;

  const renderListMode = () => {
    if (loadingPlayers) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (playerCount === 0) {
      // Empty state
      return (
        <div className="p-6">
          {showAddPlayer ? (
            <div className="bg-card rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  Add Player
                </h2>
                <button
                  onClick={() => setShowAddPlayer(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
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
              </div>
              <div className="relative z-50">
                <PlayerSearch onPlayerSelect={handleAddPlayer} />
              </div>
            </div>
          ) : (
            <>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-accent-purple"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  No players yet
                </h3>
                <p className="text-text-secondary mb-6">
                  Search and add players to your list
                </p>
              </div>
              <button
                onClick={() => setShowAddPlayer(true)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-accent-purple to-accent-purple/80 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Add Player
              </button>
            </>
          )}
        </div>
      );
    }

    if (playerCount === 1) {
      // Agenda Mode - single player spotlight
      return (
        <>
          {showAddPlayer ? (
            <div className="p-6">
              <div className="bg-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Add Player
                  </h2>
                  <button
                    onClick={() => setShowAddPlayer(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
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
                </div>
                <div className="relative z-50">
                  <PlayerSearch onPlayerSelect={handleAddPlayer} />
                </div>
              </div>
            </div>
          ) : (
            <AgendaMode
              player={playersWithData[0].player}
              links={list.links || []}
              onPlayerPress={() => setSelectedPlayer(playersWithData[0].player)}
              onAddPlayer={() => setShowAddPlayer(true)}
              onAddLink={() => setShowAddLink(true)}
              onRemoveLink={handleRemoveLink}
              onRemovePlayer={() =>
                handleRemovePlayer(playersWithData[0].playerId)
              }
            />
          )}
        </>
      );
    }

    if (playerCount === 2) {
      // VS Mode - head-to-head comparison
      return (
        <>
          {showAddPlayer ? (
            <div className="p-6">
              <div className="bg-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Add Player
                  </h2>
                  <button
                    onClick={() => setShowAddPlayer(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
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
                </div>
                <div className="relative z-50">
                  <PlayerSearch onPlayerSelect={handleAddPlayer} />
                </div>
              </div>
            </div>
          ) : (
            <VSMode
              player1={playersWithData[0].player}
              player2={playersWithData[1].player}
              links={list.links || []}
              onPlayer1Press={() =>
                setSelectedPlayer(playersWithData[0].player)
              }
              onPlayer2Press={() =>
                setSelectedPlayer(playersWithData[1].player)
              }
              onAddPlayer={() => setShowAddPlayer(true)}
              onAddLink={() => setShowAddLink(true)}
              onRemoveLink={handleRemoveLink}
              onRemovePlayer={handleRemovePlayer}
            />
          )}
        </>
      );
    }

    // Ranking Mode - 3+ players
    return (
      <>
        {showAddPlayer ? (
          <div className="p-6">
            <div className="bg-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  Add Player
                </h2>
                <button
                  onClick={() => setShowAddPlayer(false)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
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
              </div>
              <div className="relative z-50">
                <PlayerSearch onPlayerSelect={handleAddPlayer} />
              </div>
            </div>
          </div>
        ) : (
          <RankingMode
            players={playersWithData}
            links={list.links || []}
            onPlayerPress={(player) => setSelectedPlayer(player)}
            onAddPlayer={() => setShowAddPlayer(true)}
            onRemovePlayer={handleRemovePlayer}
            onReorderPlayers={handleReorderPlayers}
            onAddLink={() => setShowAddLink(true)}
            onRemoveLink={handleRemoveLink}
          />
        )}
      </>
    );
  };

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Link */}
        <Link
          href="/lists"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to My Lists
        </Link>

        {/* Header */}
        <div className="bg-card rounded-2xl p-6 mb-6">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="List name"
                maxLength={50}
                autoFocus
                className="w-full text-2xl font-bold bg-background-primary border border-white/10 rounded-xl px-4 py-2 text-text-primary focus:outline-none focus:border-accent-purple"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
                maxLength={200}
                rows={2}
                className="w-full bg-background-primary border border-white/10 rounded-xl px-4 py-2 text-text-secondary focus:outline-none focus:border-accent-purple resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(list.name);
                    setEditDescription(list.description || "");
                  }}
                  className="px-4 py-2 border border-white/10 hover:border-white/20 text-text-primary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-accent-purple hover:bg-purple-500 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-1">
                  {list.name}
                </h1>
                {list.description && (
                  <p className="text-text-secondary">{list.description}</p>
                )}
                <p className="text-sm text-text-muted mt-2">
                  {playerCount} {playerCount === 1 ? "player" : "players"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Edit list"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  {isSharing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : copied ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      Share
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* List Mode Content */}
        <div className="bg-card rounded-2xl">
          {renderListMode()}
        </div>
      </div>

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showAddLink}
        onClose={() => setShowAddLink(false)}
        onSave={handleAddLink}
      />
    </main>
  );
}
