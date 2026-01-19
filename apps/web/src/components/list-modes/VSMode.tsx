"use client";

import Image from "next/image";
import type { Player, PlayerListLink } from "@/lib/types";

interface VSModeProps {
  player1: Player;
  player2: Player;
  links: PlayerListLink[];
  onPlayer1Press: () => void;
  onPlayer2Press: () => void;
  onAddPlayer: () => void;
  onAddLink: () => void;
  onRemoveLink: (linkId: string) => void;
  onRemovePlayer: (playerId: string) => void;
}

function PlayerCard({
  player,
  onPress,
  onRemove,
  side,
}: {
  player: Player;
  onPress: () => void;
  onRemove: () => void;
  side: "left" | "right";
}) {
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isHallOfFame = player.hallOfFame === true;
  const displayTeam = player.team === "N/A" ? null : player.team;

  return (
    <div
      onClick={onPress}
      className="flex-1 relative bg-card rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:bg-card-hover transition-colors"
    >
      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={`absolute top-2 ${side === "left" ? "left-2" : "right-2"} p-1 hover:bg-white/10 rounded-full transition-colors z-10`}
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

      {/* Player Photo */}
      <div className="relative mb-3">
        {player.photoUrl ? (
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={80}
            height={80}
            className={`w-20 h-20 rounded-full object-cover border-2 ${
              isHallOfFame ? "border-gold" : "border-accent-purple"
            }`}
          />
        ) : (
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
              isHallOfFame
                ? "bg-yellow-900/20 text-gold"
                : "bg-accent-purple/20 text-accent-purple"
            }`}
          >
            {initials}
          </div>
        )}
        {isHallOfFame && (
          <div className="absolute bottom-0 right-0 bg-card rounded-full p-0.5">
            <svg
              className="w-3 h-3 text-gold"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </div>

      {/* Player Name */}
      <p
        className={`text-sm font-semibold text-center line-clamp-2 ${
          isHallOfFame ? "text-gold" : "text-text-primary"
        }`}
      >
        {player.name}
      </p>

      {/* Team */}
      {displayTeam && (
        <p className="text-xs text-text-secondary text-center mt-1">
          {displayTeam}
        </p>
      )}
    </div>
  );
}

export function VSMode({
  player1,
  player2,
  links,
  onPlayer1Press,
  onPlayer2Press,
  onAddPlayer,
  onAddLink,
  onRemoveLink,
  onRemovePlayer,
}: VSModeProps) {
  return (
    <div className="p-6 space-y-6">
      {/* VS Header */}
      <div className="flex items-center justify-center gap-2">
        {/* Player 1 */}
        <PlayerCard
          player={player1}
          onPress={onPlayer1Press}
          onRemove={() => onRemovePlayer(player1.id)}
          side="left"
        />

        {/* VS Badge */}
        <div className="relative -mx-4 z-10">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
            <span className="text-white font-bold text-sm">VS</span>
          </div>
        </div>

        {/* Player 2 */}
        <PlayerCard
          player={player2}
          onPress={onPlayer2Press}
          onRemove={() => onRemovePlayer(player2.id)}
          side="right"
        />
      </div>

      {/* Add to Ranking Button */}
      <button
        onClick={onAddPlayer}
        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-accent-purple to-accent-purple/80 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl font-semibold transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Add to Ranking
      </button>

      {/* Receipts Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <svg
            className="w-5 h-5 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="font-semibold text-text-primary">Receipts</h3>
        </div>

        {links.length === 0 ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-text-secondary">Add evidence to support your take</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl overflow-hidden">
            {links.map((link, index) => (
              <div
                key={link.id}
                className={`flex items-center gap-3 p-4 ${
                  index < links.length - 1 ? "border-b border-white/10" : ""
                }`}
              >
                <svg
                  className="w-4 h-4 text-accent-purple flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-medium truncate">{link.title}</p>
                  <p className="text-text-muted text-sm truncate">{link.url}</p>
                </div>
                <button
                  onClick={() => onRemoveLink(link.id)}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg
                    className="w-4 h-4 text-text-muted"
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
            ))}
          </div>
        )}

        <button
          onClick={onAddLink}
          className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-white/20 hover:border-accent-purple/50 rounded-xl text-accent-purple transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Receipt
        </button>
      </div>
    </div>
  );
}
