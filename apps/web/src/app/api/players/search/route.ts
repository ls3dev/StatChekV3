import { NextRequest } from "next/server";
import nbaPlayersData from "@/data/nba_playersv2.json";
import nflPlayersData from "@/data/nfl_players.json";
import mlbPlayersData from "@/data/mlb_players.json";
import type { Player } from "@/lib/types";

export type Sport = "NBA" | "NFL" | "MLB";

const playersBySport: Record<Sport, Player[]> = {
  NBA: nbaPlayersData as Player[],
  NFL: nflPlayersData as Player[],
  MLB: mlbPlayersData as Player[],
};

// Common name variations/typos
const NAME_ALIASES: Record<string, string[]> = {
  dwyane: ["dwayne", "dwane"],
  dwayne: ["dwyane", "dwane"],
  stephen: ["steph", "steven"],
  steph: ["stephen", "steven"],
  mike: ["michael"],
  michael: ["mike"],
  chris: ["christopher"],
  lebron: ["le bron"],
  shaq: ["shaquille"],
};

function normalizeForSearch(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getSearchScore(player: Player, queryWords: string[]): number {
  const nameLower = normalizeForSearch(player.name);
  const nameWords = nameLower.split(/\s+/);
  const lastName = nameWords[nameWords.length - 1];
  const firstName = nameWords[0];

  let score = 0;

  for (const qWord of queryWords) {
    // Exact last name match (highest priority)
    if (lastName === qWord) {
      score += 100;
    }
    // Last name starts with query
    else if (lastName.startsWith(qWord)) {
      score += 80;
    }
    // Exact first name match
    else if (firstName === qWord) {
      score += 60;
    }
    // First name starts with query
    else if (firstName.startsWith(qWord)) {
      score += 50;
    }
    // Any name word starts with query
    else if (nameWords.some(w => w.startsWith(qWord))) {
      score += 40;
    }
    // Name contains query
    else if (nameLower.includes(qWord)) {
      score += 20;
    }
    // Check aliases
    else {
      const aliases = NAME_ALIASES[qWord] || [];
      for (const alias of aliases) {
        if (nameLower.includes(alias)) {
          score += 15;
          break;
        }
      }
    }
  }

  // Big bonus for Hall of Fame players to push them to the top
  if (player.hallOfFame && score > 0) {
    score += 500;
  }

  return score;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const sport = (searchParams.get("sport") as Sport) || "NBA";

  if (!query) {
    return Response.json([]);
  }

  const players = playersBySport[sport] || playersBySport.NBA;
  const queryWords = normalizeForSearch(query).split(/\s+/).filter(w => w.length > 0);

  // Score and filter players
  const scoredPlayers = players
    .map(player => ({ player, score: getSearchScore(player, queryWords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ player }) => player);

  return Response.json(scoredPlayers);
}
