"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background-primary/80 backdrop-blur-lg border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold bg-gradient-to-r from-accent-purple to-purple-400 bg-clip-text text-transparent"
        >
          StatCheck
        </Link>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
          ) : isAuthenticated ? (
            <>
              <Link
                href="/lists"
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                My Lists
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">
                  {user?.name || user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text-primary border border-white/10 hover:border-white/20 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 bg-accent-purple hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
