"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useListsContext } from "@/context/ListsContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserReady, isAuthenticated, status, signOut, needsUsername } = useAuth();
  const { lists, isLoaded } = useListsContext();

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

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated" || status === "guest") {
      router.push("/lists");
    }
  }, [status, router]);

  // Calculate stats
  const totalLists = lists.length;
  const totalReceipts = lists.reduce(
    (sum, list) => sum + (list.links?.length || 0),
    0
  );

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

  // Show loading while checking auth
  if (!isAuthenticated) {
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

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-background-primary">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back Link */}
        <Link
          href="/lists"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Lists
        </Link>

        {/* Profile Card */}
        <div className="bg-background-secondary rounded-2xl border border-white/5 p-8">
          {/* Avatar & User Info */}
          <div className="flex flex-col items-center text-center mb-8">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.username || user.name || "Profile"}
                className="w-24 h-24 rounded-full mb-4 border-2 border-accent-purple"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-accent-purple/20 flex items-center justify-center mb-4 border-2 border-accent-purple">
                <span className="text-3xl font-bold text-accent-purple">
                  {user?.username?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
                </span>
              </div>
            )}
            {user?.username && (
              <p className="text-lg font-semibold text-accent-purple mb-1">
                @{user.username}
              </p>
            )}
            <h1 className="text-2xl font-bold text-text-primary">
              {user?.name || "User"}
            </h1>
            {user?.email && (
              <p className="text-text-secondary mt-1">{user.email}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-background-primary rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-accent-purple mb-1">
                {isLoaded ? totalLists : "-"}
              </div>
              <div className="text-sm text-text-secondary">
                {totalLists === 1 ? "List" : "Lists"} Created
              </div>
            </div>
            <div className="bg-background-primary rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-accent-purple mb-1">
                {isLoaded ? totalReceipts : "-"}
              </div>
              <div className="text-sm text-text-secondary">
                {totalReceipts === 1 ? "Receipt" : "Receipts"} Added
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-xl transition-colors"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
