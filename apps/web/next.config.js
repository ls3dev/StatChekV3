/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint and TypeScript errors during build (for Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
