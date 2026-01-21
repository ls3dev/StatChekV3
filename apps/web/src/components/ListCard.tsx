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
};

type ListCardProps = {
  list: PlayerList;
  onDelete: () => void;
};

export function ListCard({ list, onDelete }: ListCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const handleShare = () => {
    // Navigate to detail page where full share functionality exists
    setShowMenu(false);
    router.push(`/lists/${list.id}?share=true`);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this list?")) {
      onDelete();
    }
    setShowMenu(false);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="group relative bg-card hover:bg-card-hover rounded-2xl p-5 transition-colors">
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {/* Share Button - Always visible on hover */}
        <button
          onClick={handleShare}
          className="p-1.5 hover:bg-accent-purple/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          title="Share list"
        >
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </button>

        {/* Menu Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1.5 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg
            className="w-5 h-5 text-text-muted"
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
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-8 w-40 bg-background-secondary border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-red-400 hover:bg-white/5 transition-colors"
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

      {/* Content */}
      <Link href={`/lists/${list.id}`} className="block">
        {/* Icon */}
        <div className="w-12 h-12 bg-accent-purple/20 rounded-xl flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-accent-purple"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-text-primary mb-1 truncate pr-8">
          {list.name}
        </h3>

        {/* Description */}
        {list.description && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {list.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span className="flex items-center gap-1">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {list.playerCount} {list.playerCount === 1 ? "player" : "players"}
          </span>
          <span>Updated {formatDate(list.updatedAt)}</span>
        </div>
      </Link>
    </div>
  );
}
