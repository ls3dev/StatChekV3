import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * RevenueCat Webhook Handler
 *
 * Handles subscription events from RevenueCat to sync Pro status to Convex
 *
 * Setup in RevenueCat Dashboard:
 * 1. Go to Project Settings > Integrations > Webhooks
 * 2. Add webhook URL: https://<your-deployment>.convex.site/revenuecat-webhook
 * 3. Copy the webhook signing secret
 * 4. Add REVENUECAT_WEBHOOK_SECRET to Convex environment variables
 *
 * Events we handle:
 * - INITIAL_PURCHASE: New pro subscription
 * - RENEWAL: Subscription renewed
 * - CANCELLATION: Subscription cancelled (still active until expiry)
 * - EXPIRATION: Subscription expired
 * - BILLING_ISSUE: Payment failed
 */

// RevenueCat event types
type RevenueCatEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "PRODUCT_CHANGE"
  | "SUBSCRIBER_ALIAS"
  | "TRANSFER"
  | "TEST";

interface RevenueCatEvent {
  api_version: string;
  event: {
    type: RevenueCatEventType;
    id: string;
    app_user_id: string; // This should be the Clerk user ID
    original_app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    environment: "PRODUCTION" | "SANDBOX";
    store: string;
    is_trial_conversion: boolean;
    is_family_share: boolean;
    presented_offering_id: string | null;
    price: number;
    currency: string;
    takehome_percentage: number;
  };
}

/**
 * Verify RevenueCat webhook signature (optional but recommended)
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string | null
): boolean {
  // If no secret configured, skip verification (not recommended for production)
  if (!secret || !signature) {
    console.warn("RevenueCat webhook signature verification skipped");
    return true;
  }

  // RevenueCat uses Bearer token auth, not HMAC signatures
  // The "signature" is actually the authorization header
  return signature === `Bearer ${secret}`;
}

/**
 * HTTP endpoint for RevenueCat webhooks
 */
export const handleRevenueCatWebhook = httpAction(async (ctx, request) => {
  // Verify content type
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return new Response("Invalid content type", { status: 400 });
  }

  // Get and verify authorization
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    console.error("Invalid webhook authorization");
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse the event
  let event: RevenueCatEvent;
  try {
    const body = await request.text();
    event = JSON.parse(body) as RevenueCatEvent;
  } catch (error) {
    console.error("Failed to parse webhook body:", error);
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log(`RevenueCat webhook received: ${event.event.type}`, {
    userId: event.event.app_user_id,
    productId: event.event.product_id,
    entitlements: event.event.entitlement_ids,
    environment: event.event.environment,
  });

  // Only process events for the "pro" entitlement
  if (!event.event.entitlement_ids?.includes("pro")) {
    console.log("Ignoring non-pro entitlement event");
    return new Response("OK", { status: 200 });
  }

  // Get the Clerk user ID (should be set as app_user_id in RevenueCat)
  const clerkUserId = event.event.app_user_id;

  if (!clerkUserId || clerkUserId.startsWith("$RCAnonymousID:")) {
    console.log("Ignoring event for anonymous user");
    return new Response("OK", { status: 200 });
  }

  // Determine the new pro status based on event type
  let isProUser = false;
  let proExpiresAt: number | null = null;

  switch (event.event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
      isProUser = true;
      proExpiresAt = event.event.expiration_at_ms;
      break;

    case "CANCELLATION":
      // User cancelled but still has access until expiration
      isProUser = true;
      proExpiresAt = event.event.expiration_at_ms;
      break;

    case "EXPIRATION":
    case "BILLING_ISSUE":
      // Access revoked
      isProUser = false;
      proExpiresAt = null;
      break;

    case "PRODUCT_CHANGE":
      // Product changed - check if new product includes pro
      isProUser = event.event.entitlement_ids.includes("pro");
      proExpiresAt = isProUser ? event.event.expiration_at_ms : null;
      break;

    case "TEST":
      // Test event - just acknowledge
      console.log("Test webhook received");
      return new Response("OK", { status: 200 });

    default:
      // Ignore other events
      console.log(`Ignoring event type: ${event.event.type}`);
      return new Response("OK", { status: 200 });
  }

  // Update user's pro status in Convex
  try {
    await ctx.runMutation(internal.proWebhook._updateProStatus, {
      clerkUserId,
      isProUser,
      proExpiresAt,
    });

    console.log(`Updated pro status for user ${clerkUserId}:`, {
      isProUser,
      proExpiresAt: proExpiresAt ? new Date(proExpiresAt).toISOString() : null,
    });

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Failed to update pro status:", error);
    return new Response("Internal error", { status: 500 });
  }
});

/**
 * Internal mutation to update user's pro status
 */
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const _updateProStatus = internalMutation({
  args: {
    clerkUserId: v.string(),
    isProUser: v.boolean(),
    proExpiresAt: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();

    if (!user) {
      console.error(`User not found for Clerk ID: ${args.clerkUserId}`);
      throw new Error("User not found");
    }

    // Update pro status
    await ctx.db.patch(user._id, {
      isProUser: args.isProUser,
      proExpiresAt: args.proExpiresAt ?? undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Mutation for manual pro status sync (called from mobile app after purchase)
 */
import { mutation } from "./_generated/server";

export const syncProStatus = mutation({
  args: {
    isProUser: v.boolean(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await ctx.db.patch(user._id, {
      isProUser: args.isProUser,
      proExpiresAt: args.expiresAt,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
