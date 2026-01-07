import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { getOrCreateAnonymousId } from "../utils/anonymousAuth";

// Create Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONVEX_URL environment variable. " +
    "Copy .env.example to .env and add your Convex deployment URL."
  );
}

const convex = new ConvexReactClient(convexUrl);

// Context for user ID (anonymous or authenticated)
type UserIdContextType = {
  userId: string | null;
  isLoading: boolean;
};

const UserIdContext = createContext<UserIdContextType>({
  userId: null,
  isLoading: true,
});

/**
 * Hook to get the current user ID (anonymous or authenticated)
 */
export function useUserId() {
  const context = useContext(UserIdContext);
  if (!context) {
    throw new Error("useUserId must be used within ConvexProviderWrapper");
  }
  return context.userId;
}

/**
 * Hook to get user ID loading state
 */
export function useUserIdLoading() {
  const context = useContext(UserIdContext);
  if (!context) {
    throw new Error("useUserIdLoading must be used within ConvexProviderWrapper");
  }
  return context.isLoading;
}

/**
 * ConvexProvider wrapper with anonymous auth support
 */
export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize anonymous session on mount
    async function initializeUser() {
      try {
        const anonymousId = await getOrCreateAnonymousId();
        setUserId(anonymousId);
      } catch (error) {
        console.error("Failed to initialize anonymous user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeUser();
  }, []);

  if (isLoading) {
    // Return null or a loading screen while initializing
    return null;
  }

  return (
    <ConvexProvider client={convex}>
      <UserIdContext.Provider value={{ userId, isLoading }}>
        {children}
      </UserIdContext.Provider>
    </ConvexProvider>
  );
}
