"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PlayerList = {
  id: string;
  name: string;
  description?: string;
  playerCount: number;
  createdAt: Date;
  updatedAt: Date;
  shareId?: string;
  players?: { sport?: string }[];
};

type ListCardProps = {
  list: PlayerList;
  onDelete: () => void;
};

// Sport theme configuration
const SPORT_THEMES = {
  NBA: {
    icon: "🏀",
    label: "NBA",
    primaryColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-l-orange-500",
    glowColor: "hover:shadow-orange-500/20",
    gradientFrom: "from-orange-500/8",
    hoverBg: "hover:bg-orange-500/5",
  },
  NFL: {
    icon: "🏈",
    label: "NFL",
    primaryColor: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-l-green-500",
    glowColor: "hover:shadow-green-500/20",
    gradientFrom: "from-green-500/8",
    hoverBg: "hover:bg-green-500/5",
  },
  MLB: {
    icon: "⚾",
    label: "MLB",
    primaryColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-l-blue-500",
    glowColor: "hover:shadow-blue-500/20",
    gradientFrom: "from-blue-500/8",
    hoverBg: "hover:bg-blue-500/5",
  },
  default: {
    icon: "📋",
    label: "List",
    primaryColor: "text-accent-purple",
    bgColor: "bg-accent-purple/10",
    borderColor: "border-l-accent-purple",
    glowColor: "hover:shadow-accent-purple/20",
    gradientFrom: "from-accent-purple/8",
    hoverBg: "hover:bg-accent-purple/5",
  },
} as const;

// Determine dominant sport from players
function getListSport(players?: { sport?: string }[]): "NBA" | "NFL" | "MLB" | null {
  if (!players || players.length === 0) return null;

  const sportCounts: Record<string, number> = {};
  players.forEach((p) => {
    if (p.sport) sportCounts[p.sport] = (sportCounts[p.sport] || 0) + 1;
  });

  const entries = Object.entries(sportCounts);
  if (entries.length === 0) return null;

  const [dominant] = entries.sort(([, a], [, b]) => b - a);
  return dominant[0] as "NBA" | "NFL" | "MLB";
}

export function ListCard({ list, onDelete }: ListCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const sport = getListSport(list.players);
  const theme = sport ? SPORT_THEMES[sport] : SPORT_THEMES.default;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    router.push(`/lists/${list.id}?share=true`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this list?")) {
      onDelete();
    }
    setShowMenu(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <Link href={`/lists/${list.id}`} className="block">
      <div
        className={`
          group relative overflow-hidden
          bg-card ${theme.hoverBg}
          rounded-2xl border-l-4 ${theme.borderColor}
          p-5 transition-all duration-300 ease-out
          hover:shadow-xl ${theme.glowColor}
          hover:translate-y-[-2px]
        `}
      >
        {/* Gradient overlay */}
        <div
          className={`
            absolute inset-0 bg-gradient-to-br ${theme.gradientFrom} to-transparent
            opacity-0 group-hover:opacity-100 transition-opacity duration-300
            pointer-events-none
          `}
        />

        {/* Sport badge - top right */}
        <div
          className={`
            absolute top-4 right-4 ${theme.bgColor}
            rounded-full px-3 py-1.5
            flex items-center gap-1.5
            transition-transform duration-300
            group-hover:scale-105
          `}
        >
          <span className="text-base leading-none">{theme.icon}</span>
          <span
            className={`
              text-xs font-semibold uppercase tracking-wider
              ${theme.primaryColor}
            `}
          >
            {theme.label}
          </span>
        </div>

        {/* Content */}
        <div className="relative pt-1">
          {/* Title */}
          <h3
            className="
              font-display text-xl font-bold
              text-text-primary
              mb-2 pr-24 leading-tight
              tracking-tight
            "
          >
            {list.name}
          </h3>

          {/* Description */}
          {list.description && (
            <p
              className="
                text-sm text-text-secondary
                mb-4 line-clamp-2 leading-relaxed
              "
            >
              {list.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 text-sm mt-auto">
            <span
              className={`
                flex items-center gap-1.5 font-medium
                ${theme.primaryColor}
              `}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {list.playerCount} {list.playerCount === 1 ? "player" : "players"}
            </span>
            <span className="text-text-muted">
              {formatDate(list.updatedAt)}
            </span>
          </div>
        </div>

        {/* Action buttons - bottom right, visible on hover */}
        <div
          className="
            absolute bottom-4 right-4
            flex items-center gap-1
            opacity-0 group-hover:opacity-100
            transition-all duration-200
            translate-y-1 group-hover:translate-y-0
          "
        >
          {/* Share Button */}
          <button
            onClick={handleShare}
            className={`
              p-2 rounded-lg
              ${theme.bgColor} ${theme.primaryColor}
              hover:scale-110
              transition-all duration-200
            `}
            title="Share list"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>

          {/* Menu Button */}
          <button
            onClick={handleMenuToggle}
            className="
              p-2 rounded-lg
              hover:bg-white/10
              transition-all duration-200
            "
          >
            <svg
              className="w-4 h-4 text-text-muted"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div
                className="
                  absolute right-0 bottom-10
                  w-36 bg-background-secondary
                  border border-white/10 rounded-xl
                  shadow-xl z-20 overflow-hidden
                "
              >
                <button
                  onClick={handleDelete}
                  className="
                    w-full flex items-center gap-2
                    px-4 py-2.5 text-left
                    text-red-400 hover:bg-white/5
                    transition-colors text-sm
                  "
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
