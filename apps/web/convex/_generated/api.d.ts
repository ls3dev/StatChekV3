/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountDeletion from "../accountDeletion.js";
import type * as http from "../http.js";
import type * as lib_balldontlie from "../lib/balldontlie.js";
import type * as lib_ncaabBracket from "../lib/ncaabBracket.js";
import type * as nba from "../nba.js";
import type * as ncaab from "../ncaab.js";
import type * as playerLinks from "../playerLinks.js";
import type * as proWebhook from "../proWebhook.js";
import type * as recentPlayers from "../recentPlayers.js";
import type * as sharedLists from "../sharedLists.js";
import type * as sharedPlayers from "../sharedPlayers.js";
import type * as tradeSimulator from "../tradeSimulator.js";
import type * as userLists from "../userLists.js";
import type * as userProfileSaves from "../userProfileSaves.js";
import type * as userSettings from "../userSettings.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountDeletion: typeof accountDeletion;
  http: typeof http;
  "lib/balldontlie": typeof lib_balldontlie;
  "lib/ncaabBracket": typeof lib_ncaabBracket;
  nba: typeof nba;
  ncaab: typeof ncaab;
  playerLinks: typeof playerLinks;
  proWebhook: typeof proWebhook;
  recentPlayers: typeof recentPlayers;
  sharedLists: typeof sharedLists;
  sharedPlayers: typeof sharedPlayers;
  tradeSimulator: typeof tradeSimulator;
  userLists: typeof userLists;
  userProfileSaves: typeof userProfileSaves;
  userSettings: typeof userSettings;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
