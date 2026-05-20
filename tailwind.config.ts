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
        ink: {
          950: "#06080d",
          900: "#0a0d14",
          850: "#0e131c",
          800: "#131a26",
          700: "#1c2536",
          600: "#2a3650",
        },
        accent: {
          DEFAULT: "#ff5a1f",
          soft: "#ff7a4a",
          dark: "#cc3d0d",
        },
        lime: {
          DEFAULT: "#aef359",
          dark: "#7fc02a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.04), 0 8px 30px rgba(0,0,0,0.45)",
        accent: "0 8px 30px rgba(255,90,31,0.25)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,90,31,0.5)" },
          "70%": { boxShadow: "0 0 0 10px rgba(255,90,31,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,90,31,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "pulse-ring": "pulse-ring 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
