const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nba.com",
      },
      {
        protocol: "https",
        hostname: "**.basketball-reference.com",
      },
      {
        protocol: "https",
        hostname: "static.www.nfl.com",
      },
      {
        protocol: "https",
        hostname: "img.mlbstatic.com",
      },
    ],
  },
  // Transpile workspace packages
  transpilePackages: ["@statcheck/convex"],
  // Resolve workspace package paths
  webpack: (config) => {
    config.resolve.alias["@statcheck/convex"] = path.resolve(
      __dirname,
      "../../packages/convex"
    );
    return config;
  },
};

module.exports = nextConfig;
