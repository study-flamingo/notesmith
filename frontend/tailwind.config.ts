import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom dental-themed color palette
        dental: {
          50: "#f0fdf9",
          100: "#ccfbeb",
          200: "#9af5d8",
          300: "#5fe9c2",
          400: "#2ed3a8",
          500: "#14b892",
          600: "#0d9477",
          700: "#0f7662",
          800: "#115d4f",
          900: "#124d42",
          950: "#042f28",
        },
        // Neutral tones for clinical feel
        clinical: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

