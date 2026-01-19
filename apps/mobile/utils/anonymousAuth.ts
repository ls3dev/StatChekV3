import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ANONYMOUS_ID_KEY = "statcheck_anonymous_id";

/**
 * Generate a unique anonymous ID
 */
export function generateAnonymousId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2);
  return `anon_${timestamp}_${random}`;
}

/**
 * Get or create an anonymous ID for this device
 * Uses SecureStore on iOS/Android, localStorage on web
 */
export async function getOrCreateAnonymousId(): Promise<string> {
  if (Platform.OS === "web") {
    // Web: use localStorage
    let id = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (!id) {
      id = generateAnonymousId();
      localStorage.setItem(ANONYMOUS_ID_KEY, id);
    }
    return id;
  }

  // iOS/Android: use SecureStore
  let id = await SecureStore.getItemAsync(ANONYMOUS_ID_KEY);
  if (!id) {
    id = generateAnonymousId();
    await SecureStore.setItemAsync(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

/**
 * Clear the anonymous ID (for testing or account upgrade)
 */
export async function clearAnonymousId(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(ANONYMOUS_ID_KEY);
  } else {
    await SecureStore.deleteItemAsync(ANONYMOUS_ID_KEY);
  }
}
