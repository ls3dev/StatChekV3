const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
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
};

module.exports = nextConfig;
