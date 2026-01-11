import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Create Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_CONVEX_URL environment variable. " +
    "Copy .env.example to .env and add your Convex deployment URL."
  );
}

const convex = new ConvexReactClient(convexUrl);

// Storage adapter for React Native (SecureStore on native, localStorage on web)
const storage = Platform.OS === "web"
  ? {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key),
    }
  : {
      getItem: SecureStore.getItemAsync,
      setItem: SecureStore.setItemAsync,
      removeItem: SecureStore.deleteItemAsync,
    };

/**
 * ConvexAuthProvider wrapper for authentication
 */
export function ConvexProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthProvider client={convex} storage={storage}>
      {children}
    </ConvexAuthProvider>
  );
}
