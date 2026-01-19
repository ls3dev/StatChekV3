"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Player } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { AddLinkModal } from "./AddLinkModal";

type PlayerModalProps = {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
};

export function PlayerModal({ player, isOpen, onClose }: PlayerModalProps) {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const [showAddedMessage, setShowAddedMessage] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);

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
          relative w-full max-w-md bg-background-secondary rounded-2xl shadow-2xl
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
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
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

          {/* Add to List Button */}
          {isAuthenticated ? (
            <button
              onClick={() => {
                // TODO: Open add to list modal
                setShowAddedMessage(true);
                setTimeout(() => setShowAddedMessage(false), 2000);
              }}
              className="w-full py-3 bg-accent-purple hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
            >
              {showAddedMessage ? "Coming soon!" : "Add to List"}
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                router.push("/auth/signin");
              }}
              className="w-full py-3 bg-accent-purple hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors"
            >
              Sign in to Add to List
            </button>
          )}
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
