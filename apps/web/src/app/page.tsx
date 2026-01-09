"use client";

import { useState } from "react";
import { PlayerSearch } from "@/components/PlayerSearch";
import { PlayerModal } from "@/components/PlayerModal";
import type { Player } from "@/lib/types";

export default function HomePage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <main className="min-h-screen bg-background-primary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-background-primary to-background-primary" />

        <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24">
          {/* Logo / Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-4 text-center bg-gradient-to-r from-accent-purple to-purple-400 bg-clip-text text-transparent">
            StatCheck
          </h1>

          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-xl mx-auto text-center">
            Search players, view stats, and create your own lists
          </p>

          {/* Search */}
          <PlayerSearch onPlayerSelect={setSelectedPlayer} />
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
            description="Find any NBA player instantly with our comprehensive database"
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
            Type a name like &quot;LeBron&quot;, &quot;Jordan&quot;, or &quot;Curry&quot; in the search box above
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {["LeBron James", "Michael Jordan", "Stephen Curry", "Kobe Bryant"].map(
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
          <p>&copy; 2025 StatCheck. Built for basketball fans.</p>
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
