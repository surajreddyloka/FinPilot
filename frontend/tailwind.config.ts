import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        accent: {
          50:  "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
        },
        success: {
          50:  "#f0fdf4",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        warning: {
          50:  "#fffbeb",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        danger: {
          50:  "#fef2f2",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          elevated: "hsl(var(--surface-elevated))",
          overlay: "hsl(var(--surface-overlay))",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand": "linear-gradient(135deg, #6366f1 0%, #d946ef 100%)",
        "gradient-dark": "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
      boxShadow: {
        "glass": "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glow-brand": "0 0 24px rgba(99,102,241,0.4)",
        "glow-success": "0 0 24px rgba(34,197,94,0.3)",
        "card": "0 8px 32px rgba(0,0,0,0.24)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "count-up": "countUp 0.6s ease-out",
        "shimmer": "shimmer 1.5s infinite",
        "bounce-gentle": "bounceGentle 0.6s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideInRight: { from: { opacity: "0", transform: "translateX(20px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        pulseGlow: { "0%,100%": { boxShadow: "0 0 12px rgba(99,102,241,0.3)" }, "50%": { boxShadow: "0 0 24px rgba(99,102,241,0.7)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        bounceGentle: { "0%": { transform: "scale(0.95)" }, "60%": { transform: "scale(1.02)" }, "100%": { transform: "scale(1)" } },
      },
      borderRadius: {
        "xl2": "1.25rem",
        "xl3": "1.5rem",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
