"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export function SharedListActions({
  shareId,
  initialUpvoteCount,
}: {
  shareId: string;
  initialUpvoteCount: number;
}) {
  const router = useRouter();
  const { isAuthenticated, userId } = useAuth();
  const [isCloning, setIsCloning] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const voteState = useQuery(
    api.sharedLists.getSharedListVoteState,
    { shareId, userId: userId ?? undefined }
  );
  const cloneSharedList = useMutation(api.sharedLists.cloneSharedList);
  const upvoteSharedList = useMutation(api.sharedLists.upvoteSharedList);

  const upvoteCount = voteState?.upvoteCount ?? initialUpvoteCount;
  const hasUpvoted = voteState?.hasUpvoted ?? false;

  const handleClone = async () => {
    if (!isAuthenticated || !userId) {
      router.push("/auth/signin");
      return;
    }

    setIsCloning(true);
    try {
      const result = await cloneSharedList({ shareId, userId });
      router.push(`/lists/${result.listId}`);
    } finally {
      setIsCloning(false);
    }
  };

  const handleUpvote = async () => {
    if (!isAuthenticated || !userId) {
      router.push("/auth/signin");
      return;
    }

    if (hasUpvoted) return;

    setIsUpvoting(true);
    try {
      await upvoteSharedList({ shareId, userId });
    } finally {
      setIsUpvoting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      <button
        onClick={handleClone}
        disabled={isCloning}
        className="px-4 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-green-500 disabled:opacity-50"
      >
        {isCloning ? "Cloning..." : "Clone List"}
      </button>
      <button
        onClick={handleUpvote}
        disabled={isUpvoting || hasUpvoted}
        className={`px-4 py-3 rounded-xl font-semibold border transition-colors ${
          hasUpvoted
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "border-white/10 text-text-primary hover:border-accent/30"
        }`}
      >
        {hasUpvoted ? `Upvoted · ${upvoteCount}` : isUpvoting ? "Upvoting..." : `Upvote · ${upvoteCount}`}
      </button>
    </div>
  );
}
