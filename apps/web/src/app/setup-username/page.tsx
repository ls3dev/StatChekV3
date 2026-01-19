"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@statcheck/convex";
import { useAuth } from "@/hooks/useAuth";

export default function SetupUsernamePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, status } = useAuth();
  const [username, setUsername] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setUsernameMutation = useMutation(api.users.setUsername);

  // Debounce username for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [username]);

  // Check username availability via Convex query
  const availabilityResult = useQuery(
    api.users.checkUsernameAvailable,
    debouncedUsername.length >= 3 ? { username: debouncedUsername } : "skip"
  );

  const isChecking = debouncedUsername.length >= 3 && availabilityResult === undefined;
  const isAvailable = availabilityResult?.available ?? null;

  // Client-side validation
  const validationError = useMemo(() => {
    const trimmed = username.trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (trimmed.length > 20) {
      return "Username must be 20 characters or less";
    }
    if (trimmed.length > 0 && !/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return "Only letters, numbers, and underscores allowed";
    }
    return null;
  }, [username]);

  // Redirect if user already has username or is not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
    if (user?.username) {
      router.push("/lists");
    }
  }, [isLoading, isAuthenticated, user?.username, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = username.trim();
    if (trimmed.length < 3 || !isAvailable || validationError) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await setUsernameMutation({ username: trimmed });
      if (result.success) {
        // Force a page reload to refresh user data
        window.location.href = "/lists";
      } else {
        setError(result.error || "Failed to set username");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    username.trim().length >= 3 &&
    username.trim().length <= 20 &&
    /^[a-zA-Z0-9_]+$/.test(username.trim()) &&
    isAvailable === true &&
    !validationError;

  // Loading state
  if (isLoading || status === "loading") {
    return (
      <main className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-primary flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Choose your username
          </h1>
          <p className="text-text-secondary">
            Pick a unique username for your StatCheck profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                @
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="w-full pl-8 pr-12 py-3 bg-background-secondary border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent-purple transition-colors"
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {isChecking && (
                  <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                )}
                {!isChecking && isAvailable === true && !validationError && (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {!isChecking && isAvailable === false && !validationError && (
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Error/Status Messages */}
            <div className="mt-2 h-5">
              {validationError && (
                <p className="text-sm text-red-400">{validationError}</p>
              )}
              {!validationError && error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              {!validationError && !error && isAvailable === false && (
                <p className="text-sm text-red-400">Username is already taken</p>
              )}
              {!validationError && !error && isAvailable === true && (
                <p className="text-sm text-green-400">Username is available!</p>
              )}
            </div>
          </div>

          {/* Username requirements */}
          <div className="bg-background-secondary rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-text-secondary">
              Requirements:
            </p>
            <ul className="text-sm text-text-secondary space-y-1">
              <li className="flex items-center gap-2">
                <span
                  className={
                    username.trim().length >= 3 && username.trim().length <= 20
                      ? "text-green-400"
                      : "text-text-secondary/50"
                  }
                >
                  {username.trim().length >= 3 && username.trim().length <= 20
                    ? "✓"
                    : "○"}
                </span>
                3-20 characters
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={
                    username.trim().length > 0 &&
                    /^[a-zA-Z0-9_]+$/.test(username.trim())
                      ? "text-green-400"
                      : "text-text-secondary/50"
                  }
                >
                  {username.trim().length > 0 &&
                  /^[a-zA-Z0-9_]+$/.test(username.trim())
                    ? "✓"
                    : "○"}
                </span>
                Letters, numbers, and underscores only
              </li>
              <li className="flex items-center gap-2">
                <span
                  className={
                    isAvailable === true
                      ? "text-green-400"
                      : "text-text-secondary/50"
                  }
                >
                  {isAvailable === true ? "✓" : "○"}
                </span>
                Must be unique
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full py-3 bg-accent-purple hover:bg-purple-500 disabled:bg-accent-purple/50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Setting up...
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
