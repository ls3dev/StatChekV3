"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayerSearch, Sport } from "@/hooks/usePlayerSearch";
import type { Player } from "@/lib/types";

type PlayerSearchProps = {
  onPlayerSelect: (player: Player) => void;
};

const SPORTS: Sport[] = ["NBA", "NFL", "MLB"];

const SPORT_CONFIG: Record<Sport, { icon: string; color: string }> = {
  NBA: { icon: "🏀", color: "#F97316" },
  NFL: { icon: "🏈", color: "#3B82F6" },
  MLB: { icon: "⚾", color: "#22C55E" },
};

export function PlayerSearch({ onPlayerSelect }: PlayerSearchProps) {
  const { query, setQuery, results, isLoading, selectedSport, setSelectedSport } = usePlayerSearch();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showDropdown = isFocused && query.trim().length > 0;

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsFocused(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (player: Player) => {
    onPlayerSelect(player);
    setQuery("");
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Search Input */}
      <div
        className={`
          relative flex items-center gap-3 px-4 py-3
          bg-card rounded-xl border transition-all duration-200
          ${isFocused ? "border-accent-purple shadow-lg shadow-accent-purple/20" : "border-transparent"}
        `}
      >
        {/* Search Icon */}
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${selectedSport} players...`}
          className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => setQuery("")}
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
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Sport Selector */}
      <div className="flex justify-center gap-2 mt-4">
        {SPORTS.map((sport) => {
          const config = SPORT_CONFIG[sport];
          const isSelected = selectedSport === sport;
          return (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-200
                ${isSelected
                  ? "text-white shadow-lg"
                  : "bg-card text-text-secondary hover:bg-white/10"
                }
              `}
              style={isSelected ? { backgroundColor: config.color } : undefined}
            >
              <span>{config.icon}</span>
              <span>{sport}</span>
            </button>
          );
        })}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-[#1e1e2a] rounded-xl border border-white/20 shadow-2xl z-50 max-h-96 overflow-y-auto"
        >
          {results.length === 0 && !isLoading ? (
            <div className="px-4 py-8 text-center text-text-secondary">
              No players found
            </div>
          ) : (
            <>
              {results.map((player, index) => (
                <SearchResult
                  key={`${player.sport}-${player.id}`}
                  player={player}
                  isSelected={index === selectedIndex}
                  onSelect={() => handleSelect(player)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Search Result Item
function SearchResult({
  player,
  isSelected,
  onSelect,
}: {
  player: Player;
  isSelected: boolean;
  onSelect: () => void;
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
    <button
      onClick={onSelect}
      className={`
        w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
        border-b border-white/10 last:border-b-0
        ${isSelected ? "bg-accent-purple/30 border-l-2 border-l-accent-purple" : "hover:bg-white/15"}
        ${isHallOfFame ? "border-l-4 border-l-gold bg-yellow-900/20" : ""}
      `}
    >
      {/* Avatar */}
      {player.photoUrl ? (
        <img
          src={player.photoUrl}
          alt={player.name}
          width={40}
          height={40}
          className={`w-10 h-10 rounded-full object-cover ${isHallOfFame ? "ring-2 ring-gold" : ""}`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      {player.photoUrl ? (
        <div
          className={`
            hidden w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
            ${isHallOfFame ? "bg-yellow-900/30 text-gold" : "bg-accent-purple/20 text-accent-purple"}
          `}
        >
          {initials}
        </div>
      ) : (
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
            ${isHallOfFame ? "bg-yellow-900/30 text-gold" : "bg-accent-purple/20 text-accent-purple"}
          `}
        >
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className={`font-semibold text-[15px] truncate ${isHallOfFame ? "text-gold" : "text-white"}`}
        >
          {player.name}
        </div>
        {(displayTeam || displayPosition) && (
          <div className="text-sm text-gray-400 truncate">
            {displayTeam && displayPosition
              ? `${displayTeam} · ${displayPosition}`
              : displayTeam || displayPosition}
          </div>
        )}
      </div>

      {/* Sport & HOF Badges */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isHallOfFame && (
          <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-900/30 text-gold rounded">
            HOF
          </span>
        )}
        <span className="text-xs font-medium px-2 py-0.5 bg-white/10 text-text-secondary rounded">
          {player.sport}
        </span>
      </div>
    </button>
  );
}
