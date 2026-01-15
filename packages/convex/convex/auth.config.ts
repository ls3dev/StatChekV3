// Clerk JWT validation configuration for Convex
// The domain should match your Clerk JWT template's Issuer URL

const authConfig = {
  providers: [
    {
      // This will be set via Convex environment variable
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
