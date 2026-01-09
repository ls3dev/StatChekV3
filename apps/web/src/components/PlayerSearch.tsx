"use client";

import { useState, useRef, useEffect } from "react";
import { usePlayerSearch } from "@/hooks/usePlayerSearch";
import type { Player } from "@/lib/types";
import Image from "next/image";

type PlayerSearchProps = {
  onPlayerSelect: (player: Player) => void;
};

export function PlayerSearch({ onPlayerSelect }: PlayerSearchProps) {
  const { query, setQuery, results, isLoading } = usePlayerSearch();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showDropdown = isFocused && query.trim().length > 0;
  const displayResults = results.slice(0, 5);
  const remainingCount = results.length > 5 ? results.length - 5 : 0;

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
          prev < displayResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && displayResults[selectedIndex]) {
          handleSelect(displayResults[selectedIndex]);
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
          placeholder="Search players..."
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

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-white/10 shadow-xl overflow-hidden z-50"
        >
          {results.length === 0 && !isLoading ? (
            <div className="px-4 py-8 text-center text-text-secondary">
              No players found
            </div>
          ) : (
            <>
              {displayResults.map((player, index) => (
                <SearchResult
                  key={player.id}
                  player={player}
                  isSelected={index === selectedIndex}
                  onSelect={() => handleSelect(player)}
                />
              ))}
              {remainingCount > 0 && (
                <div className="px-4 py-2 text-sm text-text-muted text-center border-t border-white/5">
                  +{remainingCount} more results
                </div>
              )}
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
        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
        ${isSelected ? "bg-white/10" : "hover:bg-white/5"}
        ${isHallOfFame ? "border-l-4 border-gold bg-yellow-900/10" : ""}
      `}
    >
      {/* Avatar */}
      {player.photoUrl ? (
        <Image
          src={player.photoUrl}
          alt={player.name}
          width={40}
          height={40}
          className={`w-10 h-10 rounded-full object-cover ${isHallOfFame ? "ring-2 ring-gold" : ""}`}
        />
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
      </div>

      {/* HOF Badge */}
      {isHallOfFame && (
        <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-900/30 text-gold rounded">
          HOF
        </span>
      )}
    </button>
  );
}
