// Sentry disabled temporarily for debugging

// Stub types
type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// Initialize Sentry - disabled
export function initSentry() {
  console.log('Sentry disabled');
}

// Capture an exception manually - no-op
export function captureException(error: Error, context?: Record<string, any>) {
  console.log('captureException (disabled):', error.message);
}

// Capture a message - no-op
export function captureMessage(message: string, level: SeverityLevel = 'info') {
  console.log('captureMessage (disabled):', message);
}

// Set user context - no-op
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  // no-op
}

// Add breadcrumb - no-op
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  // no-op
}

// Export stub Sentry
export const Sentry = {
  init: () => {},
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
  addBreadcrumb: () => {},
};
