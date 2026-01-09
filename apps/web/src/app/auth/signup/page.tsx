"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || "Sign up failed");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-bold bg-gradient-to-r from-accent-purple to-purple-400 bg-clip-text text-transparent"
          >
            StatCheck
          </Link>
          <h1 className="text-2xl font-bold text-text-primary mt-6">
            Create an account
          </h1>
          <p className="text-text-secondary mt-2">
            Start building your player lists
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-colors"
                placeholder="Your name"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple transition-colors"
                placeholder="Confirm your password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-accent-purple hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-text-muted text-sm">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Sign In Link */}
          <p className="text-center text-text-secondary">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-accent-purple hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back to Home */}
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-text-muted hover:text-text-secondary transition-colors"
          >
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
