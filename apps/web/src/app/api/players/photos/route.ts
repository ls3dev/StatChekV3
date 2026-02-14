import { NextRequest } from "next/server";
import nbaPlayersData from "@/data/nba_playersv2.json";
import type { Player } from "@/lib/types";

const players = nbaPlayersData as Player[];

// Strip accents: Dončić → Doncic, Jokić → Jokic
function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Build a normalized name → player lookup
const playerLookup = new Map<string, Player>();
for (const p of players) {
  playerLookup.set(normalize(p.name), p);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const names = searchParams.get("names")?.split(",").map(n => n.trim()) || [];

  const result: Record<string, Player> = {};
  for (const name of names) {
    const player = playerLookup.get(normalize(name));
    if (player) {
      result[name] = player;
    }
  }

  return Response.json(result);
}
