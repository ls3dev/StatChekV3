import { httpRouter } from "convex/server";

const http = httpRouter();

// Clerk handles all auth routes - no HTTP routes needed in Convex for auth

export default http;
