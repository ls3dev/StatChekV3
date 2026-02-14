"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useClerk } from "@clerk/nextjs";

export function useAuth() {
  const auth = useAuthContext();
  const { openSignIn, openSignUp } = useClerk();

  return {
    user: auth.user,
    userId: auth.userId,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    isGuest: auth.isGuest,
    isUserReady: auth.isUserReady,
    isProUser: auth.isProUser,
    needsUsername: auth.needsUsername,
    status: auth.status,
    signIn: openSignIn,
    signUp: openSignUp,
    signOut: auth.signOut,
    continueAsGuest: auth.continueAsGuest,
  };
}
