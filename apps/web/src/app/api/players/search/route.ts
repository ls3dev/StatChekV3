import { NextRequest } from "next/server";
import playersData from "@/data/nba_playersv2.json";
import type { Player } from "@/lib/types";

const players = playersData as Player[];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase().trim() || "";

  if (!query) {
    return Response.json([]);
  }

  const results = players
    .filter((player) => {
      const haystack = `${player.name} ${player.team} ${player.position}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 20);

  return Response.json(results);
}
