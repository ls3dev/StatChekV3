"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function Header() {
  const { user, isLoading, isAuthenticated, status } = useAuth();

  // Don't show header during onboarding
  if (status === "onboarding") {
    return null;
  }

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
                  {user?.username ? `@${user.username}` : user?.name || user?.email}
                </span>
                <Link
                  href="/profile"
                  className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                  title="Profile"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/lists"
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                My Lists
              </Link>
              <SignInButton mode="modal">
                <button className="text-text-secondary hover:text-text-primary transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 bg-accent-purple hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
