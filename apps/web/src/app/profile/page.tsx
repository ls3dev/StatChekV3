"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useListsContext } from "@/context/ListsContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userId, isUserReady, isAuthenticated, status, signOut } = useAuth();
  const { lists, isLoaded } = useListsContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Theme settings
  const settings = useQuery(
    api.userSettings.getUserSettings,
    userId ? { userId } : "skip"
  );
  const setTheme = useMutation(api.userSettings.setTheme);
  const deleteAccount = useMutation(api.accountDeletion.deleteAccount);

  // Redirect to onboarding if needed
  useEffect(() => {
    if (status === "onboarding") {
      router.push("/onboarding");
    }
  }, [status, router]);

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
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </main>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setIsDeleting(true);
    try {
      await deleteAccount({ userId });
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setIsDeleting(false);
    }
  };

  const handleThemeChange = async (theme: "light" | "dark") => {
    if (!userId || theme === "light") return;
    await setTheme({ userId, theme });
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
                className="w-24 h-24 rounded-full mb-4 border-2 border-accent"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-4 border-2 border-accent">
                <span className="text-3xl font-bold text-accent">
                  {user?.username?.charAt(0) || user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
                </span>
              </div>
            )}
            {user?.username && (
              <p className="text-lg font-semibold text-accent mb-1">
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
              <div className="text-3xl font-bold text-accent mb-1">
                {isLoaded ? totalLists : "-"}
              </div>
              <div className="text-sm text-text-secondary">
                {totalLists === 1 ? "List" : "Lists"} Created
              </div>
            </div>
            <div className="bg-background-primary rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-accent mb-1">
                {isLoaded ? totalReceipts : "-"}
              </div>
              <div className="text-sm text-text-secondary">
                {totalReceipts === 1 ? "Receipt" : "Receipts"} Added
              </div>
            </div>
          </div>

          {/* Theme Section */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3">
              Theme
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                  (settings?.theme ?? "dark") === "dark"
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-background-primary text-text-secondary border border-white/5 hover:border-white/10"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Dark
              </button>
              <button
                disabled
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-background-primary text-text-muted border border-white/5 cursor-not-allowed opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Light
                <span className="text-xs">(Coming Soon)</span>
              </button>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-text-secondary font-medium rounded-xl transition-colors mb-3"
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

          {/* Delete Account Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-background-secondary rounded-2xl border border-white/10 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-text-primary">Delete Account</h2>
            </div>
            <p className="text-text-secondary mb-6">
              Are you sure? This will permanently delete all your lists, settings, and data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-text-primary font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
