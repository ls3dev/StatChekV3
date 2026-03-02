import { httpRouter } from "convex/server";
import { handleRevenueCatWebhook } from "./proWebhook";

const http = httpRouter();

// Clerk handles all auth routes - no HTTP routes needed in Convex for auth

// RevenueCat webhook for subscription events
http.route({
  path: "/revenuecat-webhook",
  method: "POST",
  handler: handleRevenueCatWebhook,
});

export default http;
