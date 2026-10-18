// Export the Convex API for use in mobile/web apps.
// The Convex functions live in apps/web/convex (the single source deployed
// for both apps), so the web build on Vercel can reach them.
export { api } from '../../apps/web/convex/_generated/api';
