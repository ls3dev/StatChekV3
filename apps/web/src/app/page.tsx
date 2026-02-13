"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayerSearch } from "@/components/PlayerSearch";
import { PlayerModal } from "@/components/PlayerModal";
import type { Player } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { status } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (status === "onboarding") {
      router.push("/onboarding");
    }
  }, [status, router]);

  // Show loading while checking onboarding status
  if (status === "loading" || status === "onboarding") {
    return (
      <main className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <div className="relative">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-background-primary to-background-primary overflow-hidden" />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 z-10">
          {/* Logo / Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-center bg-gradient-to-r from-accent-purple to-purple-400 bg-clip-text text-transparent">
            StatCheck
          </h1>

          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-xl mx-auto text-center">
            Search players, view stats, and create your own lists
          </p>

          {/* Search */}
          <div className="relative z-50">
            <PlayerSearch onPlayerSelect={setSelectedPlayer} />
          </div>

          {/* Create List CTA */}
          <div className="mt-8 text-center">
            <a
              href="/lists"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-accent-purple to-purple-600 hover:from-purple-500 hover:to-purple-700 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-purple-500/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your List
            </a>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <QuickActionCard icon="📋" title="My Lists" href="/lists" />
          <QuickActionCard icon="🏀" title="NBA Scores" href="/scores" />
          <QuickActionCard icon="🏆" title="NBA Standings" href="/standings" />
        </div>
      </div>

      {/* Try it Section */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-card rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">
            Try searching for a player
          </h2>
          <p className="text-text-secondary mb-6">
            Type a name like &quot;LeBron&quot;, &quot;Mahomes&quot;, or &quot;Ohtani&quot; in the search box above
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["LeBron James", "Patrick Mahomes", "Shohei Ohtani", "Travis Kelce"].map(
              (name) => (
                <span
                  key={name}
                  className="px-3 py-1 bg-accent-purple/20 text-accent-purple rounded-full text-sm"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-text-muted">
          <p>&copy; 2025 StatCheck. Built for sports fans.</p>
        </div>
      </footer>

      {/* Player Modal */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </main>
  );
}

function QuickActionCard({
  icon,
  title,
  href,
}: {
  icon: string;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 p-4 md:p-5 rounded-xl transition-all text-center bg-card hover:bg-card/80 hover:scale-105 text-text-primary"
    >
      <span className="text-2xl md:text-3xl">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </Link>
  );
}
