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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
