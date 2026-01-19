// Storage keys
const ONBOARDING_COMPLETE_KEY = "statcheck_onboarding_complete";
const ANONYMOUS_ID_KEY = "statcheck_anonymous_id";

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === "true";
}

/**
 * Mark onboarding as complete
 */
export function setOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
  // Dispatch custom event for same-tab listeners
  window.dispatchEvent(new CustomEvent("onboarding-complete"));
}

/**
 * Reset onboarding (for testing)
 */
export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
}

/**
 * Get or create an anonymous user ID for guest mode
 */
export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "";

  let anonId = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!anonId) {
    anonId = `anon_${crypto.randomUUID()}`;
    localStorage.setItem(ANONYMOUS_ID_KEY, anonId);
  }
  return anonId;
}

/**
 * Get the current anonymous ID (without creating one)
 */
export function getAnonymousId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ANONYMOUS_ID_KEY);
}
