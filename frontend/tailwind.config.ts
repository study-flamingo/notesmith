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
        // ARC-esque dark theme palette
        arc: {
          bg: "#15101a",
          "bg-light": "#1e1726",
          "bg-lighter": "#2a2233",
          surface: "#251d2e",
          "surface-hover": "#342940",
          border: "#3d3347",
          "border-bright": "#4a3f55",
        },
        // Text colors
        text: {
          primary: "#eeeeee",
          secondary: "#999999",
          dim: "#666666",
          muted: "#4a4a4a",
        },
        // Accent colors
        accent: {
          red: "#f80909",
          "red-dim": "#c00707",
          yellow: "#f7cb09",
          "yellow-dim": "#c4a007",
          green: "#2ef38a",
          "green-dim": "#25c26e",
          cyan: "#84f3ec",
          "cyan-dim": "#6ac2bc",
        },
        // Legacy dental colors (keep for compatibility)
        dental: {
          50: "#f0fdf9",
          100: "#ccfbeb",
          200: "#9af5d8",
          300: "#5fe9c2",
          400: "#2ed3a8",
          500: "#2ef38a", // Updated to accent green
          600: "#25c26e",
          700: "#1f9a58",
          800: "#1a7a46",
          900: "#155f37",
          950: "#0d3d23",
        },
        // Clinical neutrals mapped to arc
        clinical: {
          50: "#2a2233",
          100: "#251d2e",
          200: "#1e1726",
          300: "#3d3347",
          400: "#666666",
          500: "#999999",
          600: "#eeeeee",
          700: "#eeeeee",
          800: "#15101a",
          900: "#15101a",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      boxShadow: {
        // Glow effects
        "glow-red": "0 0 20px rgba(248, 9, 9, 0.4), 0 0 40px rgba(248, 9, 9, 0.2)",
        "glow-red-sm": "0 0 10px rgba(248, 9, 9, 0.3)",
        "glow-yellow": "0 0 20px rgba(247, 203, 9, 0.4), 0 0 40px rgba(247, 203, 9, 0.2)",
        "glow-yellow-sm": "0 0 10px rgba(247, 203, 9, 0.3)",
        "glow-green": "0 0 20px rgba(46, 243, 138, 0.4), 0 0 40px rgba(46, 243, 138, 0.2)",
        "glow-green-sm": "0 0 10px rgba(46, 243, 138, 0.3)",
        "glow-cyan": "0 0 20px rgba(132, 243, 236, 0.4), 0 0 40px rgba(132, 243, 236, 0.2)",
        "glow-cyan-sm": "0 0 10px rgba(132, 243, 236, 0.3)",
        "glow-white": "0 0 15px rgba(238, 238, 238, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "fade-in-up": "fadeInUp 0.4s ease-out",
        "fade-in-down": "fadeInDown 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
