import { NextRequest } from "next/server";
import nbaPlayersData from "@/data/nba_playersv2.json";
import type { Player } from "@/lib/types";

const players = nbaPlayersData as Player[];

// Build a normalized name → photoUrl lookup
const photoLookup = new Map<string, string>();
for (const p of players) {
  if (p.photoUrl) {
    photoLookup.set(p.name.toLowerCase(), p.photoUrl);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const names = searchParams.get("names")?.split(",").map(n => n.trim()) || [];

  const result: Record<string, string> = {};
  for (const name of names) {
    const url = photoLookup.get(name.toLowerCase());
    if (url) {
      result[name] = url;
    }
  }

  return Response.json(result);
}
