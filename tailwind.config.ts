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
        // Obsidian neutral surface scale (cool near-black).
        ink: {
          950: "#08090d",
          900: "#0b0d13",
          850: "#0f121a",
          800: "#141826",
          700: "#1b2030",
          600: "#262c40",
        },
        // Primary accent: electric indigo-violet.
        accent: {
          DEFAULT: "#7c6cff",
          soft: "#9d91ff",
          dark: "#5b4bd6",
        },
        lime: {
          DEFAULT: "#a3e635",
          dark: "#84cc16",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 12px 40px -12px rgba(0,0,0,0.7)",
        accent: "0 10px 30px -8px rgba(124,108,255,0.55)",
        soft: "0 8px 30px -12px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #8b7dff 0%, #6d5cf0 100%)",
        "card-sheen":
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 30%)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(124,108,255,0.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(124,108,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(124,108,255,0)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-4%,0) scale(1.08)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.16,1,0.3,1)",
        "pulse-ring": "pulse-ring 2.4s infinite",
        aurora: "aurora 18s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
