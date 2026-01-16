import { ClerkProvider, ClerkLoading, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { View, ActivityIndicator, StyleSheet } from "react-native";

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
 * Debug component to log auth state
 */
function AuthDebugger({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, userId } = useAuth();

  useEffect(() => {
    const debugAuth = async () => {
      console.log('[AUTH DEBUG] Clerk isLoaded:', isLoaded);
      console.log('[AUTH DEBUG] Clerk isSignedIn:', isSignedIn);
      console.log('[AUTH DEBUG] Clerk userId:', userId);

      if (isLoaded && isSignedIn) {
        try {
          // Try to get the Convex JWT token
          const token = await getToken({ template: 'convex' });
          console.log('[AUTH DEBUG] Convex JWT token:', token ? `${token.substring(0, 50)}...` : 'null');

          if (token) {
            // Decode JWT to see claims (base64 decode the payload)
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              console.log('[AUTH DEBUG] JWT payload:', JSON.stringify(payload, null, 2));
            }
          }
        } catch (err) {
          console.error('[AUTH DEBUG] Error getting token:', err);
        }
      }
    };

    debugAuth();
  }, [isLoaded, isSignedIn, getToken, userId]);

  return <>{children}</>;
}

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
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#7C3AED" />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <ClerkLoading>
        <LoadingScreen />
      </ClerkLoading>
      <ClerkLoaded>
        <AuthDebugger>
          <ConvexClerkProvider>{children}</ConvexClerkProvider>
        </AuthDebugger>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
