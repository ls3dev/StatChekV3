"use client";

import Image from "next/image";
import type { Player, PlayerListItem, PlayerListLink } from "@/lib/types";

type PlayerWithData = PlayerListItem & { player: Player };

interface RankingModeProps {
  players: PlayerWithData[];
  links: PlayerListLink[];
  onPlayerPress: (player: Player) => void;
  onAddPlayer: () => void;
  onRemovePlayer: (playerId: string) => void;
  onReorderPlayers: (data: PlayerWithData[]) => void;
  onAddLink: () => void;
  onRemoveLink: (linkId: string) => void;
}

function RankPlayerRow({
  item,
  index,
  totalCount,
  onPress,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  item: PlayerWithData;
  index: number;
  totalCount: number;
  onPress: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const player = item.player;

  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isHallOfFame = player.hallOfFame === true;
  const displayTeam = player.team === "N/A" ? null : player.team;
  const displayPosition = player.position === "N/A" ? null : player.position;

  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  // Rank styling
  const getRankStyle = () => {
    if (index === 0) return { bg: "bg-[#FFD700]", text: "text-black" }; // Gold
    if (index === 1) return { bg: "bg-[#C0C0C0]", text: "text-black" }; // Silver
    if (index === 2) return { bg: "bg-[#CD7F32]", text: "text-white" }; // Bronze
    return { bg: "bg-white/10", text: "text-text-secondary" };
  };

  const rankStyle = getRankStyle();

  return (
    <div
      className={`
        overflow-hidden
        ${isFirst ? "rounded-t-xl" : ""}
        ${isLast ? "rounded-b-xl" : ""}
        ${isHallOfFame ? "border-l-4 border-gold" : ""}
      `}
    >
      <div
        onClick={onPress}
        className={`
          flex items-center gap-3 p-4 cursor-pointer transition-colors
          ${isHallOfFame ? "bg-yellow-900/10 hover:bg-yellow-900/20" : "bg-card hover:bg-card-hover"}
          ${!isLast ? "border-b border-white/10" : ""}
        `}
      >
        {/* Reorder Arrows */}
        <div className="flex flex-col items-center justify-center mr-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={isFirst}
            className={`p-0.5 rounded transition-colors ${
              isFirst
                ? "text-white/20 cursor-not-allowed"
                : "text-text-primary hover:bg-white/10"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={isLast}
            className={`p-0.5 rounded transition-colors ${
              isLast
                ? "text-white/20 cursor-not-allowed"
                : "text-text-primary hover:bg-white/10"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Rank Badge */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${rankStyle.bg} ${rankStyle.text}`}
        >
          {index + 1}
        </div>

        {/* Avatar */}
        {player.photoUrl ? (
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={40}
            height={40}
            className={`w-10 h-10 rounded-full object-cover ${
              isHallOfFame ? "border-2 border-gold" : ""
            }`}
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              isHallOfFame
                ? "bg-yellow-900/20 text-gold"
                : "bg-accent-purple/20 text-accent-purple"
            }`}
          >
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold truncate ${
              isHallOfFame ? "text-gold" : "text-text-primary"
            }`}
          >
            {player.name}
          </p>
          {(displayTeam || displayPosition) && (
            <p className="text-sm text-text-secondary truncate">
              {displayTeam && displayPosition
                ? `${displayTeam} · ${displayPosition}`
                : displayTeam || displayPosition}
            </p>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>

        {/* Chevron */}
        <svg
          className={`w-5 h-5 ${isHallOfFame ? "text-gold" : "text-text-muted"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

export function RankingMode({
  players,
  links,
  onPlayerPress,
  onAddPlayer,
  onRemovePlayer,
  onReorderPlayers,
  onAddLink,
  onRemoveLink,
}: RankingModeProps) {
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newPlayers = [...players];
    [newPlayers[index - 1], newPlayers[index]] = [
      newPlayers[index],
      newPlayers[index - 1],
    ];
    onReorderPlayers(newPlayers);
  };

  const handleMoveDown = (index: number) => {
    if (index === players.length - 1) return;
    const newPlayers = [...players];
    [newPlayers[index], newPlayers[index + 1]] = [
      newPlayers[index + 1],
      newPlayers[index],
    ];
    onReorderPlayers(newPlayers);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Rankings Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-text-primary">Rankings</h2>
        <button
          onClick={onAddPlayer}
          className="text-accent-purple font-semibold hover:text-purple-400 transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Rankings List */}
      <div>
        {players.map((item, index) => (
          <RankPlayerRow
            key={item.playerId}
            item={item}
            index={index}
            totalCount={players.length}
            onPress={() => onPlayerPress(item.player)}
            onRemove={() => onRemovePlayer(item.playerId)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
          />
        ))}
      </div>

      {/* Add More Players */}
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
        Add Player
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
            <p className="text-text-secondary">Add evidence to support your rankings</p>
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
