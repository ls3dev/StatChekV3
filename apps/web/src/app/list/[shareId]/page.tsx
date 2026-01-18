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
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 px-4 py-3 border-b border-purple-500/20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">StatCheck</p>
                <p className="text-white/60 text-xs">
                  {platform === "ios" ? "Get it on the App Store" : "Get it on Google Play"}
                </p>
              </div>
            </div>
            <a
              href={platform === "ios" ? appStoreUrl : playStoreUrl}
              className="px-5 py-2 bg-white text-purple-900 rounded-full text-sm font-bold hover:bg-white/90 transition-all hover:scale-105 shadow-lg shadow-white/10"
            >
              Get App
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative bg-gradient-to-br from-purple-900/60 via-purple-800/30 to-background-primary border-b border-white/5 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="relative max-w-3xl mx-auto px-6 py-10">
          <a
            href="/"
            className="text-accent-purple hover:text-purple-400 text-sm mb-4 inline-flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            StatCheck
          </a>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            {list.name}
          </h1>
          {list.description && (
            <p className="text-text-secondary text-lg max-w-xl">{list.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-5 text-text-muted text-sm">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {list.players.length} players
            </span>
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {list.viewCount} views
            </span>
            {list.sharedByName && (
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                by {list.sharedByName}
              </span>
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
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-accent-purple/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Receipts
            </h2>
            <div className="space-y-2">
              {list.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card border border-white/5 hover:bg-card-hover hover:border-accent-purple/30 p-4 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-purple/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-accent-purple/20 transition-colors">
                      <svg className="w-5 h-5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium group-hover:text-accent-purple transition-colors truncate block">
                        {link.title}
                      </span>
                      <span className="text-text-muted text-sm truncate block">
                        {link.url}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-text-muted group-hover:text-accent-purple group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* App Promo */}
        <div className="mt-12 relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-card rounded-2xl p-8 text-center border border-purple-500/30">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-purple/10 rounded-full blur-3xl" />

          <div className="relative">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-purple-500/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold mb-2">Create your own lists</h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Download StatCheck to create and share your player rankings with friends
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={appStoreUrl}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white text-black rounded-xl font-bold hover:bg-white/90 hover:scale-105 transition-all shadow-lg shadow-white/10"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                App Store
              </a>
              <a
                href={playStoreUrl}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-500 hover:to-purple-700 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-purple-500/30"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                Google Play
              </a>
            </div>
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

  // Gradient rank badges for top 3
  const getRankBadgeClass = () => {
    if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/30";
    if (rank === 2) return "bg-gradient-to-br from-gray-200 to-gray-400 text-black shadow-lg shadow-gray-400/20";
    if (rank === 3) return "bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30";
    return "bg-white/10 text-white/60 border border-white/10";
  };

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
        isHallOfFame
          ? "bg-yellow-900/20 border border-gold/30 hover:bg-yellow-900/30 hover:border-gold/50"
          : "bg-card border border-white/5 hover:bg-card-hover hover:border-white/10 hover:translate-x-1"
      }`}
    >
      {/* Rank Badge */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getRankBadgeClass()}`}
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
          className={`w-12 h-12 rounded-full object-cover flex-shrink-0 ${
            isHallOfFame ? "ring-2 ring-gold ring-offset-2 ring-offset-background-primary" : ""
          }`}
        />
      ) : (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0 ${
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
          className={`font-bold truncate ${
            isHallOfFame ? "text-gold" : "text-white"
          }`}
        >
          {player.name}
        </h3>
        {(displayTeam || displayPosition) && (
          <p className="text-text-muted text-sm truncate">
            {displayTeam && displayPosition
              ? `${displayTeam} · ${displayPosition}`
              : displayTeam || displayPosition}
          </p>
        )}
      </div>

      {/* Hall of Fame Badge */}
      {isHallOfFame && (
        <span className="text-gold text-xs font-bold px-2.5 py-1 bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 rounded-full flex items-center gap-1.5 border border-gold/30 flex-shrink-0">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          HOF
        </span>
      )}
    </div>
  );
}
