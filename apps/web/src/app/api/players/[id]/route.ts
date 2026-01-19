import { NextRequest } from "next/server";
import nbaPlayersData from "@/data/nba_playersv2.json";
import nflPlayersData from "@/data/nfl_players.json";
import mlbPlayersData from "@/data/mlb_players.json";
import type { Player } from "@/lib/types";

type Sport = "NBA" | "NFL" | "MLB";

const playersBySport: Record<Sport, Player[]> = {
  NBA: nbaPlayersData as Player[],
  NFL: nflPlayersData as Player[],
  MLB: mlbPlayersData as Player[],
};

// Combine all players into one lookup map
const allPlayersById = new Map<string, Player>();
for (const sport of Object.keys(playersBySport) as Sport[]) {
  for (const player of playersBySport[sport]) {
    allPlayersById.set(player.id, player);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") as Sport | null;

  if (!id) {
    return Response.json({ error: "Player ID is required" }, { status: 400 });
  }

  // If sport provided, search only that sport first (prevents ID collision)
  if (sport && playersBySport[sport]) {
    const player = playersBySport[sport].find((p) => p.id === id);
    if (player) {
      return Response.json(player);
    }
  }

  // Fallback: search all sports (backwards compat for existing data without sport)
  const player = allPlayersById.get(id);

  if (!player) {
    return Response.json({ error: "Player not found" }, { status: 404 });
  }

  return Response.json(player);
}
