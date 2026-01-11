"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { PlayerSearch } from "@/components/PlayerSearch";
import { PlayerModal } from "@/components/PlayerModal";
import type { Player } from "@/lib/types";

type PlayerList = {
  id: string;
  name: string;
  description?: string;
  players: Player[];
  createdAt: Date;
  updatedAt: Date;
  shareId?: string;
};

// Mock data - will be replaced with Convex
const getMockList = (id: string): PlayerList | null => {
  return {
    id,
    name: "My Favorite Players",
    description: "A collection of the greatest basketball players",
    players: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export default function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [list, setList] = useState<PlayerList | null>(() => getMockList(id));
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(list?.name || "");
  const [editDescription, setEditDescription] = useState(
    list?.description || ""
  );
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [copied, setCopied] = useState(false);

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push("/auth/signin");
    return null;
  }

  if (isLoading) {
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

  const handleSaveEdit = () => {
    if (editName.trim()) {
      setList({
        ...list,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        updatedAt: new Date(),
      });
      setIsEditing(false);
    }
  };

  const handleAddPlayer = (player: Player) => {
    // Check if player already exists in list
    if (list.players.some((p) => p.id === player.id)) {
      return;
    }

    setList({
      ...list,
      players: [...list.players, player],
      updatedAt: new Date(),
    });
    setShowAddPlayer(false);
  };

  const handleRemovePlayer = (playerId: string) => {
    setList({
      ...list,
      players: list.players.filter((p) => p.id !== playerId),
      updatedAt: new Date(),
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/list/${list.shareId || list.id}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                  {list.players.length}{" "}
                  {list.players.length === 1 ? "player" : "players"}
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
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Share list"
                >
                  {copied ? (
                    <svg
                      className="w-5 h-5 text-green-400"
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
                  ) : (
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
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Player Section */}
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
            <PlayerSearch onPlayerSelect={handleAddPlayer} />
          </div>
        ) : (
          <button
            onClick={() => setShowAddPlayer(true)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-card hover:bg-card-hover border-2 border-dashed border-white/10 hover:border-accent-purple/50 rounded-2xl text-text-secondary hover:text-accent-purple transition-colors mb-6"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Player
          </button>
        )}

        {/* Players List */}
        {list.players.length === 0 ? (
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
            <p className="text-text-secondary">
              Search and add players to your list
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {list.players.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                onView={() => setSelectedPlayer(player)}
                onRemove={() => handleRemovePlayer(player.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </main>
  );
}

function PlayerRow({
  player,
  onView,
  onRemove,
}: {
  player: Player;
  onView: () => void;
  onRemove: () => void;
}) {
  const isHallOfFame = player.hallOfFame === true;
  const displayTeam = player.team === "N/A" ? null : player.team;
  const displayPosition = player.position === "N/A" ? null : player.position;

  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`
        group flex items-center gap-4 p-4 bg-card hover:bg-card-hover rounded-xl transition-colors
        ${isHallOfFame ? "border-l-4 border-gold" : ""}
      `}
    >
      {/* Avatar */}
      <button onClick={onView} className="flex-shrink-0">
        {player.photoUrl ? (
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={48}
            height={48}
            className={`w-12 h-12 rounded-full object-cover ${isHallOfFame ? "ring-2 ring-gold" : ""}`}
          />
        ) : (
          <div
            className={`
              w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold
              ${isHallOfFame ? "bg-yellow-900/30 text-gold" : "bg-accent-purple/20 text-accent-purple"}
            `}
          >
            {initials}
          </div>
        )}
      </button>

      {/* Info */}
      <button onClick={onView} className="flex-1 text-left min-w-0">
        <div
          className={`font-medium truncate ${isHallOfFame ? "text-gold" : "text-text-primary"}`}
        >
          {player.name}
        </div>
        {(displayTeam || displayPosition) && (
          <div className="text-sm text-text-secondary truncate">
            {displayTeam && displayPosition
              ? `${displayTeam} · ${displayPosition}`
              : displayTeam || displayPosition}
          </div>
        )}
      </button>

      {/* HOF Badge */}
      {isHallOfFame && (
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 bg-yellow-900/30 text-gold rounded">
          HOF
        </span>
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
        title="Remove from list"
      >
        <svg
          className="w-4 h-4 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
  );
}
