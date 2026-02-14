"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useListsContext } from "@/context/ListsContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserReady, isAuthenticated, isProUser, status, signOut } = useAuth();
  const { lists, isLoaded } = useListsContext();
  const grantProMutation = useMutation(api.users.grantPro);
  const [isGranting, setIsGranting] = useState(false);

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">
                {user?.name || "User"}
              </h1>
              {isProUser && (
                <span className="px-2 py-0.5 bg-accent-purple rounded text-[10px] font-bold text-white uppercase">
                  Pro
                </span>
              )}
            </div>
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

          {/* Pro Status */}
          <div className="mb-8">
            {isProUser ? (
              <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-purple-300 font-semibold text-lg">StatCheck Pro</p>
                  <p className="text-text-secondary text-sm">Unlimited lists, advanced stats, and more</p>
                </div>
              </div>
            ) : (
              <button
                onClick={async () => {
                  setIsGranting(true);
                  try {
                    await grantProMutation();
                    window.location.reload();
                  } catch (error) {
                    console.error("Failed to grant pro:", error);
                  } finally {
                    setIsGranting(false);
                  }
                }}
                disabled={isGranting}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-semibold rounded-xl p-5 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {isGranting ? "Activating..." : "Upgrade to Pro"}
              </button>
            )}
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
