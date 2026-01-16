import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

// Create Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!convexUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONVEX_URL environment variable. " +
    "Copy .env.example to .env and add your Convex deployment URL."
  );
}

if (!clerkPublishableKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable. " +
    "Add your Clerk publishable key to .env"
  );
}

const convex = new ConvexReactClient(convexUrl);

/**
 * Inner provider that connects Convex with Clerk auth
 */
function ConvexClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

/**
 * Main provider wrapper - Clerk must wrap Convex
 * ClerkLoaded ensures Clerk is ready before Convex tries to use it
 */
export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ConvexClerkProvider>{children}</ConvexClerkProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
