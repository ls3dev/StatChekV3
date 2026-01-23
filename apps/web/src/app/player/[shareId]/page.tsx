import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.statcheckapp.com";
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://coordinated-gazelle-93.convex.cloud";

interface Props {
  params: Promise<{ shareId: string }>;
}

// Fetch shared player from Convex
async function getSharedPlayer(shareId: string) {
  try {
    console.log(`[SharedPlayer] Fetching player with shareId: ${shareId}`);

    const player = await fetchQuery(
      api.sharedPlayers.getSharedPlayer,
      { shareId },
      { url: convexUrl }
    );

    if (player) {
      console.log(`[SharedPlayer] Found player: ${player.name}`);
    } else {
      console.log(`[SharedPlayer] No player found for shareId: ${shareId}`);
    }

    return player;
  } catch (error) {
    console.error("[SharedPlayer] Failed to fetch shared player:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const player = await getSharedPlayer(shareId);

  if (!player) {
    return { title: "Player Not Found | StatCheck" };
  }

  const byLine = player.sharedByName ? `Shared by ${player.sharedByName}` : "";
  const teamPosition = [player.team, player.position].filter(Boolean).join(" · ");

  const description = player.hallOfFame
    ? `${player.name} - Hall of Fame${teamPosition ? ` · ${teamPosition}` : ""}${byLine ? ` · ${byLine}` : ""}`
    : `${player.name}${teamPosition ? ` · ${teamPosition}` : ""}${byLine ? ` · ${byLine}` : ""}`;

  const ogTitle = player.sharedByName
    ? `${player.name} - shared by ${player.sharedByName}`
    : player.name;

  return {
    title: `${player.name} | StatCheck`,
    description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: ogTitle,
      description,
      type: "website",
      url: `${baseUrl}/player/${shareId}`,
      siteName: "StatCheck",
      images: player.photoUrl
        ? [
            {
              url: player.photoUrl,
              width: 400,
              height: 400,
              alt: `${player.name} photo`,
            },
          ]
        : [
            {
              url: `${baseUrl}/og-image.png`,
              width: 1200,
              height: 630,
              alt: `${player.name} on StatCheck`,
            },
          ],
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description,
      images: player.photoUrl ? [player.photoUrl] : [`${baseUrl}/og-image.png`],
    },
  };
}

export default async function SharedPlayerPage({ params }: Props) {
  const { shareId } = await params;
  const player = await getSharedPlayer(shareId);

  if (!player) {
    notFound();
  }

  const isHallOfFame = player.hallOfFame === true;
  const displayTeam = player.team === "N/A" ? null : player.team;
  const displayPosition = player.position === "N/A" ? null : player.position;

  const initials = player.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-background-primary">
      {/* Header */}
      <header
        className={`
          relative border-b border-white/5 overflow-hidden
          ${isHallOfFame
            ? "bg-gradient-to-br from-yellow-900/40 via-yellow-800/20 to-background-primary"
            : "bg-gradient-to-br from-purple-900/60 via-purple-800/30 to-background-primary"
          }
        `}
      >
        {/* Decorative glow */}
        <div
          className={`
            absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl -translate-y-1/2
            ${isHallOfFame ? "bg-yellow-500/10" : "bg-purple-500/10"}
          `}
        />

        <div className="relative max-w-3xl mx-auto px-6 py-10">
          <a
            href="/"
            className={`
              text-sm mb-6 inline-flex items-center gap-1 transition-colors
              ${isHallOfFame ? "text-gold hover:text-yellow-300" : "text-accent-purple hover:text-purple-400"}
            `}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            StatCheck
          </a>

          {/* Player Photo */}
          <div className="flex justify-center mb-6">
            {player.photoUrl ? (
              <Image
                src={player.photoUrl}
                alt={player.name}
                width={160}
                height={160}
                className={`
                  w-36 h-36 rounded-full object-cover shadow-2xl
                  ${isHallOfFame ? "ring-4 ring-gold ring-offset-4 ring-offset-background-primary" : "ring-4 ring-accent-purple/50 ring-offset-4 ring-offset-background-primary"}
                `}
              />
            ) : (
              <div
                className={`
                  w-36 h-36 rounded-full flex items-center justify-center text-5xl font-bold shadow-2xl
                  ${isHallOfFame ? "bg-yellow-900/30 text-gold ring-4 ring-gold" : "bg-accent-purple/20 text-accent-purple ring-4 ring-accent-purple/50"}
                `}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Player Name */}
          <h1
            className={`
              text-3xl md:text-4xl font-extrabold text-center mb-2
              ${isHallOfFame ? "text-gold" : "bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"}
            `}
          >
            {player.name}
          </h1>

          {/* Team & Position */}
          {(displayTeam || displayPosition) && (
            <p className="text-center text-text-secondary text-lg mb-4">
              {displayTeam && displayPosition
                ? `${displayTeam} · ${displayPosition}`
                : displayTeam || displayPosition}
            </p>
          )}

          {/* Hall of Fame Badge */}
          {isHallOfFame && (
            <div className="flex justify-center mb-4">
              <span className="text-gold text-sm font-bold px-4 py-1.5 bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 rounded-full flex items-center gap-2 border border-gold/30">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Hall of Fame
              </span>
            </div>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-text-muted text-sm">
            <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {player.viewCount} views
            </span>
            {player.sharedByName && (
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                by {player.sharedByName}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Quick Links */}
        {player.sportsReferenceUrl && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-4">
              Quick Links
            </h2>
            <a
              href={player.sportsReferenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-4 bg-card border border-white/5 hover:bg-card-hover hover:border-accent-purple/30 rounded-xl transition-all group"
            >
              <div className="w-10 h-10 bg-accent-purple/20 rounded-lg flex items-center justify-center group-hover:bg-accent-purple/30 transition-colors">
                <svg
                  className="w-5 h-5 text-accent-purple"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-text-primary font-medium group-hover:text-accent-purple transition-colors">
                  Sports Reference
                </div>
                <div className="text-sm text-text-secondary">
                  View full stats and career history
                </div>
              </div>
              <svg
                className="w-5 h-5 text-text-muted group-hover:text-accent-purple group-hover:translate-x-0.5 transition-all"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        )}

        {/* Receipts Section */}
        {player.links && player.links.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-accent-purple/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              Receipts
            </h2>
            <div className="space-y-2">
              {player.links.map((link: { id: string; url: string; title: string; order: number }) => (
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold mb-2">Track your player takes</h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Sign up for StatCheck to save receipts, create lists, and share your sports takes
            </p>

            <a
              href="/"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-500 hover:to-purple-700 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-purple-500/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
