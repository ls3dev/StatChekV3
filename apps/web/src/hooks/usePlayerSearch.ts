"use client";

import { useState, useEffect } from "react";
import type { Player } from "@/lib/types";

export function usePlayerSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(trimmed)}`);
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
  }, [query]);

  return { query, setQuery, results, isLoading };
}
