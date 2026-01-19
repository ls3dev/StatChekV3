"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import {
  hasCompletedOnboarding,
  getOrCreateAnonymousId,
} from "@/utils/storage";

type AuthStatus =
  | "loading"
  | "onboarding"
  | "unauthenticated"
  | "authenticated"
  | "guest";

interface User {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  image?: string;
}

interface AuthContextType {
  status: AuthStatus;
  user: User | null;
  userId: string | null;
  anonymousId: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  isUserReady: boolean;
  needsUsername: boolean;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Convex auth state (validates Clerk JWT with Convex backend)
  const { isAuthenticated: convexIsAuthenticated, isLoading: convexIsLoading } =
    useConvexAuth();

  // Clerk hooks
  const { signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();

  // Sync user to Convex on authentication
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [anonymousId, setAnonymousId] = useState<string | null>(null);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Sync Clerk user to Convex and update local state
  useEffect(() => {
    const syncUser = async () => {
      if (convexIsAuthenticated && clerkUser) {
        try {
          const convexUser = await getOrCreateUser();
          if (convexUser) {
            setUser({
              id: convexUser.id,
              email: convexUser.email,
              name: convexUser.name,
              username: convexUser.username,
              image: convexUser.image,
            });
          }
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      } else if (!convexIsAuthenticated) {
        setUser(null);
      }
    };
    syncUser();
  }, [convexIsAuthenticated, clerkUser, getOrCreateUser]);

  // Check onboarding status on mount and when navigating (client-side only)
  useEffect(() => {
    const checkOnboarding = () => {
      const onboardingComplete = hasCompletedOnboarding();
      if (!onboardingComplete) {
        setStatus("onboarding");
      } else if (status === "onboarding") {
        // Onboarding was just completed, transition to loading to trigger auth check
        setStatus("loading");
      }
      setOnboardingChecked(true);
      const anonId = getOrCreateAnonymousId();
      setAnonymousId(anonId);
    };
    checkOnboarding();

    // Listen for onboarding complete event (same tab)
    const handleOnboardingComplete = () => {
      setStatus("loading");
    };
    window.addEventListener("onboarding-complete", handleOnboardingComplete);

    // Listen for storage changes (other tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "statcheck_onboarding_complete" && e.newValue === "true") {
        setStatus("loading");
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("onboarding-complete", handleOnboardingComplete);
      window.removeEventListener("storage", handleStorage);
    };
  }, [status]);

  // Update status based on Convex auth state
  useEffect(() => {
    // Wait for onboarding check to complete first
    if (!onboardingChecked) return;
    // Don't override onboarding or guest status
    if (status === "onboarding") return;
    if (status === "guest") return;
    // Wait for Convex auth to be ready
    if (convexIsLoading) return;

    // Update to authenticated or unauthenticated based on Convex auth
    if (convexIsAuthenticated) {
      setStatus("authenticated");
    } else {
      setStatus("unauthenticated");
    }
  }, [convexIsAuthenticated, convexIsLoading, onboardingChecked, status]);

  const handleSignOut = useCallback(async () => {
    try {
      await clerkSignOut();
      setUser(null);
      setStatus("unauthenticated");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, [clerkSignOut]);

  const continueAsGuest = useCallback(() => {
    setStatus("guest");
  }, []);

  // userId: Clerk ID when authenticated, anonymous ID for guests
  const userId = useMemo(() => {
    if (convexIsAuthenticated && user?.id) {
      return user.id;
    }
    return anonymousId;
  }, [convexIsAuthenticated, user?.id, anonymousId]);

  // isUserReady: true when userId is properly initialized
  const isUserReady = useMemo(() => {
    if (status === "loading" || status === "onboarding") return false;
    if (convexIsAuthenticated) {
      return user?.id !== undefined;
    }
    return anonymousId !== null;
  }, [status, convexIsAuthenticated, user?.id, anonymousId]);

  // needsUsername: true when authenticated but no username set
  const needsUsername = useMemo(() => {
    return status === "authenticated" && user !== null && !user.username;
  }, [status, user]);

  const value: AuthContextType = {
    status,
    user,
    userId,
    anonymousId,
    isAuthenticated: status === "authenticated",
    isGuest: status === "guest" || status === "unauthenticated",
    isLoading: status === "loading",
    isUserReady,
    needsUsername,
    signOut: handleSignOut,
    continueAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
