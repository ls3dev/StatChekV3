/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Match mobile app design tokens
        background: {
          primary: "#0A0A0F",
          secondary: "#12121A",
        },
        card: {
          DEFAULT: "#1A1A24",
          hover: "#22222E",
        },
        accent: {
          purple: "#8B5CF6",
          primary: "#A78BFA",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#A1A1AA",
          muted: "#71717A",
        },
        gold: {
          DEFAULT: "#FFD700",
          secondary: "#FFA500",
        },
        // Sport-specific colors
        sport: {
          nba: "#F97316",
          nfl: "#22C55E",
          mlb: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
