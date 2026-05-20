import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme semantic tokens.
        fg: "#0f172a", // primary text (slate-900)
        strong: "#334155", // strong secondary text (slate-700)
        muted: "#64748b", // secondary text (slate-500)
        faint: "#94a3b8", // tertiary text / labels (slate-400)
        line: "#e6e9f1", // borders
        panel: "#eef1f8", // secondary fills
        surface: "#ffffff", // cards
        // Primary accent: electric indigo-violet.
        accent: {
          DEFAULT: "#6d5cf0",
          soft: "#8b7dff",
          dark: "#5b4bd6",
        },
        lime: {
          DEFAULT: "#84cc16",
          dark: "#65a30d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 1px 2px rgba(15,23,42,0.04), 0 14px 34px -16px rgba(15,23,42,0.22)",
        soft: "0 8px 24px -14px rgba(15,23,42,0.18)",
        accent: "0 12px 26px -10px rgba(109,92,240,0.55)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #8b7dff 0%, #6d5cf0 100%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(109,92,240,0.4)" },
          "70%": { boxShadow: "0 0 0 12px rgba(109,92,240,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(109,92,240,0)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-3%,0) scale(1.06)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.16,1,0.3,1)",
        "pulse-ring": "pulse-ring 2.4s infinite",
        aurora: "aurora 20s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
