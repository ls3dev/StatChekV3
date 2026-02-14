import { NextRequest } from "next/server";
import nbaPlayersData from "@/data/nba_playersv2.json";
import type { Player } from "@/lib/types";

const players = nbaPlayersData as Player[];

// Build a normalized name → player lookup
const playerLookup = new Map<string, Player>();
for (const p of players) {
  playerLookup.set(p.name.toLowerCase(), p);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const names = searchParams.get("names")?.split(",").map(n => n.trim()) || [];

  const result: Record<string, Player> = {};
  for (const name of names) {
    const player = playerLookup.get(name.toLowerCase());
    if (player) {
      result[name] = player;
    }
  }

  return Response.json(result);
}
