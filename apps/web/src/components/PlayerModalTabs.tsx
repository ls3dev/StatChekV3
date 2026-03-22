"use client";

export type PlayerModalTab = "stats" | "contract" | "links";

interface PlayerModalTabsProps {
  activeTab: PlayerModalTab;
  onTabChange: (tab: PlayerModalTab) => void;
  isNBA: boolean;
  isNCAAM?: boolean;
}

const tabs: { key: PlayerModalTab; label: string; showFor: "nba" | "stats" | "all" }[] = [
  { key: "stats", label: "Stats", showFor: "stats" },
  { key: "contract", label: "Contract", showFor: "nba" },
  { key: "links", label: "Links", showFor: "all" },
];

export function PlayerModalTabs({
  activeTab,
  onTabChange,
  isNBA,
  isNCAAM,
}: PlayerModalTabsProps) {
  const visibleTabs = tabs.filter((t) => {
    if (t.showFor === "all") return true;
    if (t.showFor === "nba") return isNBA;
    if (t.showFor === "stats") return isNBA || isNCAAM;
    return false;
  });

  return (
    <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
      {visibleTabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeTab === tab.key
              ? "bg-accent text-white shadow-lg shadow-green-500/20"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
