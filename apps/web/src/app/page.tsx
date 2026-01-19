"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

      {/* Features Section */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-8 text-text-primary">
          Why StatCheck?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🔍"
            title="Search Players"
            description="Find any player instantly with our comprehensive database"
          />
          <FeatureCard
            icon="📊"
            title="View Stats"
            description="Access career statistics and Sports Reference links"
          />
          <FeatureCard
            icon="📋"
            title="Create Lists"
            description="Sign in to organize players into custom lists and share them"
          />
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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card p-6 rounded-2xl">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-text-primary">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  );
}
