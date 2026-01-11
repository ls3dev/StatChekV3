import { notFound } from "next/navigation";
import Image from "next/image";
import { headers } from "next/headers";
import { fetchQuery } from "convex/nextjs";
import { api } from "@statcheck/convex";

interface Props {
  params: Promise<{ shareId: string }>;
}

// Fetch shared list from Convex
async function getSharedList(shareId: string) {
  try {
    const list = await fetchQuery(api.sharedLists.getSharedList, { shareId });
    return list;
  } catch (error) {
    console.error("Failed to fetch shared list:", error);
    return null;
  }
}

// Detect platform from user agent
function detectPlatform(userAgent: string): "ios" | "android" | "desktop" {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

export async function generateMetadata({ params }: Props) {
  const { shareId } = await params;
  const list = await getSharedList(shareId);

  if (!list) {
    return { title: "List Not Found | StatCheck" };
  }

  const playerNames = list.players
    .slice(0, 3)
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join(", ");
  const description =
    list.description ||
    `${list.players.length} players: ${playerNames}${list.players.length > 3 ? "..." : ""}`;

  return {
    title: `${list.name} | StatCheck`,
    description,
    openGraph: {
      title: list.name,
      description,
      type: "website",
      siteName: "StatCheck",
      images: [
        {
          url: "/og-image.png", // Default OG image
          width: 1200,
          height: 630,
          alt: list.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: list.name,
      description,
    },
  };
}

export default async function SharedListPage({ params }: Props) {
  const { shareId } = await params;
  const list = await getSharedList(shareId);

  if (!list) {
    notFound();
  }

  // Detect platform for smart app banner
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const platform = detectPlatform(userAgent);

  const appStoreUrl = "https://apps.apple.com/app/statcheck/id123456789"; // TODO: Replace with real App Store ID
  const playStoreUrl =
    "https://play.google.com/store/apps/details?id=com.statcheck.app";

  return (
    <main className="min-h-screen bg-background-primary">
      {/* Smart App Banner */}
      {platform !== "desktop" && (
        <div className="bg-gradient-to-r from-purple-900 to-purple-800 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">StatCheck</p>
                <p className="text-white/70 text-xs">
                  {platform === "ios" ? "Open in App Store" : "Open in Play Store"}
                </p>
              </div>
            </div>
            <a
              href={platform === "ios" ? appStoreUrl : playStoreUrl}
              className="px-4 py-2 bg-white text-purple-900 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Get App
            </a>
          </div>
        </div>
      )}

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
            {list.sharedByName && (
              <>
                <span>•</span>
                <span>by {list.sharedByName}</span>
              </>
            )}
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

        {/* Links/Receipts Section */}
        {list.links && list.links.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📎</span> Receipts
            </h2>
            <div className="space-y-2">
              {list.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card hover:bg-card-hover p-4 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-accent-purple">🔗</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-white group-hover:text-accent-purple transition-colors truncate block">
                        {link.title}
                      </span>
                      <span className="text-text-muted text-sm truncate block">
                        {link.url}
                      </span>
                    </div>
                    <span className="text-text-muted">↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* App Promo */}
        <div className="mt-12 bg-gradient-to-br from-purple-900/30 to-card rounded-2xl p-6 text-center border border-purple-500/20">
          <h3 className="text-xl font-semibold mb-2">Create your own lists</h3>
          <p className="text-text-secondary mb-4">
            Download StatCheck to create and share your player rankings
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={appStoreUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
            <a
              href={playStoreUrl}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent-purple hover:bg-purple-500 rounded-xl font-semibold transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              Google Play
            </a>
          </div>
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

  // Rank badge colors
  const getRankBadgeClass = () => {
    if (rank === 1) return "bg-yellow-500 text-black";
    if (rank === 2) return "bg-gray-300 text-black";
    if (rank === 3) return "bg-amber-600 text-white";
    return "bg-white/10 text-white/60";
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
        isHallOfFame
          ? "bg-yellow-900/20 border-l-4 border-gold"
          : "bg-card hover:bg-card-hover"
      }`}
    >
      {/* Rank Badge */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeClass()}`}
      >
        {rank}
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
            isHallOfFame ? "text-gold" : ""
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
        <span className="text-gold text-xs font-semibold px-2 py-1 bg-yellow-900/30 rounded flex items-center gap-1">
          <span>⭐</span> HOF
        </span>
      )}
    </div>
  );
}
