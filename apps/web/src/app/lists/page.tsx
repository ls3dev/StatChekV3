"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { ListCard } from "@/components/ListCard";
import { CreateListModal } from "@/components/CreateListModal";
import { useState } from "react";

export default function ListsPage() {
  const router = useRouter();
  const { userId, isUserReady, status, needsUsername } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (status === "onboarding") {
      router.push("/onboarding");
    }
  }, [status, router]);

  // Redirect to setup-username if authenticated but no username
  useEffect(() => {
    if (needsUsername) {
      router.push("/setup-username");
    }
  }, [needsUsername, router]);

  // Query lists from Convex (skip if no userId yet)
  const lists = useQuery(
    api.userLists.getUserLists,
    userId ? { userId } : "skip"
  );

  // Mutations
  const createListMutation = useMutation(api.userLists.createList);
  const deleteListMutation = useMutation(api.userLists.deleteList);

  // Loading state
  if (!isUserReady || status === "loading" || status === "onboarding") {
    return (
      <main className="min-h-screen bg-background-primary">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </main>
    );
  }

  const handleCreateList = async (name: string, description: string) => {
    if (!userId) return;

    try {
      await createListMutation({
        userId,
        name,
        description: description || undefined,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create list:", error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteListMutation({ listId: listId as any });
    } catch (error) {
      console.error("Failed to delete list:", error);
    }
  };

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">My Lists</h1>
            <p className="text-text-secondary mt-1">
              Organize your favorite players into custom lists
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-purple hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New List
          </button>
        </div>

        {/* Lists Grid */}
        {lists === undefined ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : lists.length === 0 ? (
          <EmptyState onCreateList={() => setShowCreateModal(true)} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((list) => (
              <ListCard
                key={list._id}
                list={{
                  id: list._id,
                  name: list.name,
                  description: list.description,
                  playerCount: list.players.length,
                  createdAt: new Date(list.createdAt),
                  updatedAt: new Date(list.updatedAt),
                }}
                onDelete={() => handleDeleteList(list._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateList}
      />
    </main>
  );
}

function EmptyState({ onCreateList }: { onCreateList: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 bg-accent-purple/10 rounded-2xl flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-accent-purple"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        No lists yet
      </h2>
      <p className="text-text-secondary text-center max-w-sm mb-6">
        Create your first list to start organizing players. You can add players
        from search results.
      </p>
      <button
        onClick={onCreateList}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent-purple hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Your First List
      </button>
    </div>
  );
}
