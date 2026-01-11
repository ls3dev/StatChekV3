import { notFound } from "next/navigation";
import Image from "next/image";

// TODO: Replace with actual Convex fetch once deployed
// import { fetchQuery } from "convex/nextjs";
// import { api } from "@statcheck/convex/_generated/api";

interface Props {
  params: Promise<{ shareId: string }>;
}

// Mock data for development - will be replaced with Convex query
async function getSharedList(shareId: string) {
  // TODO: Replace with actual Convex fetch
  // return await fetchQuery(api.sharedLists.getSharedList, { shareId });

  // Mock data for now
  if (shareId === "demo") {
    return {
      shareId: "demo",
      name: "My All-Time Favorites",
      description: "The greatest players I've ever watched",
      players: [
        {
          playerId: "1",
          order: 0,
          name: "LeBron James",
          team: "Los Angeles Lakers",
          position: "SF",
          photoUrl: "https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png",
          hallOfFame: false,
        },
        {
          playerId: "2",
          order: 1,
          name: "Michael Jordan",
          team: "N/A",
          position: "SG",
          hallOfFame: true,
        },
        {
          playerId: "3",
          order: 2,
          name: "Kareem Abdul-Jabbar",
          team: "N/A",
          position: "C",
          hallOfFame: true,
        },
      ],
      links: [],
      sharedAt: Date.now(),
      viewCount: 42,
      isPublic: true,
      originalCreatedAt: Date.now() - 86400000,
      originalUpdatedAt: Date.now(),
    };
  }

  return null;
}

export async function generateMetadata({ params }: Props) {
  const { shareId } = await params;
  const list = await getSharedList(shareId);

  if (!list) {
    return { title: "List Not Found | StatCheck" };
  }

  return {
    title: `${list.name} | StatCheck`,
    description:
      list.description || `A list of ${list.players.length} players`,
    openGraph: {
      title: list.name,
      description:
        list.description ||
        `Check out this list of ${list.players.length} players`,
      type: "website",
    },
  };
}

export default async function SharedListPage({ params }: Props) {
  const { shareId } = await params;
  const list = await getSharedList(shareId);

  if (!list) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900/50 to-background-primary border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <a
            href="/"
            className="text-accent-purple hover:text-purple-400 text-sm mb-4 inline-block"
          >
            ← StatCheck
          </a>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{list.name}</h1>
          {list.description && (
            <p className="text-text-secondary text-lg">{list.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-text-muted text-sm">
            <span>{list.players.length} players</span>
            <span>•</span>
            <span>{list.viewCount} views</span>
          </div>
        </div>
      </header>

      {/* Player List */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="space-y-3">
          {list.players.map((player, index) => (
            <PlayerCard key={player.playerId} player={player} rank={index + 1} />
          ))}
        </div>

        {/* Links Section */}
        {list.links.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Links</h2>
            <div className="space-y-2">
              {list.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card hover:bg-card-hover p-4 rounded-xl transition-colors"
                >
                  <span className="text-accent-purple">{link.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* App Promo */}
        <div className="mt-12 bg-card rounded-2xl p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">
            Create your own lists
          </h3>
          <p className="text-text-secondary mb-4">
            Download StatCheck to create and share your basketball player lists
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-accent-purple hover:bg-purple-500 rounded-xl font-semibold transition-colors"
          >
            Get the App
          </a>
        </div>
      </div>
    </main>
  );
}

// Player Card Component
function PlayerCard({
  player,
  rank,
}: {
  player: {
    playerId: string;
    name: string;
    team: string;
    position: string;
    photoUrl?: string;
    hallOfFame?: boolean;
  };
  rank: number;
}) {
  const isHallOfFame = player.hallOfFame === true;
  const displayTeam = player.team === "N/A" ? null : player.team;
  const displayPosition = player.position === "N/A" ? null : player.position;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
        isHallOfFame
          ? "bg-yellow-900/20 border-l-4 border-gold"
          : "bg-card hover:bg-card-hover"
      }`}
    >
      {/* Rank */}
      <div className="w-8 text-center">
        <span className="text-text-muted font-mono">{rank}</span>
      </div>

      {/* Avatar */}
      {player.photoUrl ? (
        <Image
          src={player.photoUrl}
          alt={player.name}
          width={48}
          height={48}
          className={`w-12 h-12 rounded-full object-cover ${
            isHallOfFame ? "ring-2 ring-gold" : ""
          }`}
        />
      ) : (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
            isHallOfFame
              ? "bg-yellow-900/30 text-gold"
              : "bg-accent-purple/20 text-accent-purple"
          }`}
        >
          {player.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3
          className={`font-semibold truncate ${
            isHallOfFame ? "text-gold gold-shimmer" : ""
          }`}
        >
          {player.name}
        </h3>
        {(displayTeam || displayPosition) && (
          <p className="text-text-secondary text-sm truncate">
            {displayTeam && displayPosition
              ? `${displayTeam} · ${displayPosition}`
              : displayTeam || displayPosition}
          </p>
        )}
      </div>

      {/* Hall of Fame Badge */}
      {isHallOfFame && (
        <span className="text-gold text-xs font-semibold px-2 py-1 bg-yellow-900/30 rounded">
          HOF
        </span>
      )}
    </div>
  );
}
