"use client";

import { useState, useEffect } from "react";

// Stub auth client - replace with actual auth implementation (Clerk, Better Auth, etc.)

type Session = {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  } | null;
  session: {
    id: string;
  } | null;
};

export function useSession() {
  const [data, setData] = useState<Session | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: Implement actual session check
    setIsPending(false);
    setData({ user: null, session: null });
  }, []);

  return { data, isPending, error };
}

export async function signIn(provider: string, options?: { email?: string; password?: string }) {
  // TODO: Implement actual sign in
  console.log("Sign in called with:", provider, options);
  throw new Error("Auth not implemented - add Clerk or another auth provider");
}

export async function signUp(options: { email: string; password: string; name?: string }) {
  // TODO: Implement actual sign up
  console.log("Sign up called with:", options);
  throw new Error("Auth not implemented - add Clerk or another auth provider");
}

export async function signOut() {
  // TODO: Implement actual sign out
  console.log("Sign out called");
}
