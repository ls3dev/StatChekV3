import { ClerkProvider, ClerkLoading, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const missingEnvVars = [
  !convexUrl ? "EXPO_PUBLIC_CONVEX_URL" : null,
  !clerkPublishableKey ? "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" : null,
].filter(Boolean) as string[];
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

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
  if (!convex) {
    return null;
  }

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

function ConfigErrorScreen({ missing }: { missing: string[] }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Configuration Error</Text>
      <Text style={styles.errorBody}>
        Missing required app environment variables:
      </Text>
      {missing.map((name) => (
        <Text key={name} style={styles.errorVar}>
          - {name}
        </Text>
      ))}
      <Text style={styles.errorHint}>
        Configure these in EAS environment variables for this build profile.
      </Text>
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
  errorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorBody: {
    color: '#D4D4D8',
    fontSize: 15,
    marginBottom: 8,
  },
  errorVar: {
    color: '#F87171',
    fontSize: 14,
    marginBottom: 4,
  },
  errorHint: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 12,
  },
});

export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  if (missingEnvVars.length > 0 || !clerkPublishableKey) {
    return <ConfigErrorScreen missing={missingEnvVars} />;
  }

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
