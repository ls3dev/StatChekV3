import * as Sentry from '@sentry/react-native';

// Initialize Sentry - call this in app entry point
export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,

    // Set environment based on build profile
    environment: __DEV__ ? 'development' : 'production',

    // Enable native crash reporting
    enableNativeCrashHandling: true,

    // Capture 100% of transactions for performance monitoring
    // Reduce this in production if you have high traffic
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Don't send events in development unless testing Sentry
    enabled: !__DEV__,

    // Attach screenshots to error reports (iOS only)
    attachScreenshot: true,

    // Add breadcrumbs for debugging
    enableAutoSessionTracking: true,

    // Configure what data to send
    beforeSend(event) {
      // You can modify or filter events here
      return event;
    },
  });
}

// Capture an exception manually
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Capture a message
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

// Set user context (call after authentication)
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// Export Sentry for advanced usage
export { Sentry };
