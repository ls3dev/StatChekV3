"use client";

import { useState, useEffect } from "react";
import type { Player } from "@/lib/types";

export type Sport = "NBA" | "NFL" | "MLB";

const SPORT_STORAGE_KEY = "statcheck_selected_sport";

export function usePlayerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSportState] = useState<Sport>("NBA");

  // Load saved sport preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(SPORT_STORAGE_KEY);
    if (saved && (saved === "NBA" || saved === "NFL" || saved === "MLB")) {
      setSelectedSportState(saved as Sport);
    }
  }, []);

  const setSelectedSport = (sport: Sport) => {
    setSelectedSportState(sport);
    localStorage.setItem(SPORT_STORAGE_KEY, sport);
    setQuery(""); // Clear search when switching sports
  };

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      return;
    }

    // Debounce search
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/players/search?q=${encodeURIComponent(trimmed)}&sport=${selectedSport}`
        );
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query, selectedSport]);

  return { query, setQuery, results, isLoading, selectedSport, setSelectedSport };
}
