import type { Config } from "tailwindcss";

/**
 * Cup Sync design system — chai-inspired, warm and clean.
 * Tokens are exposed as semantic colors so components reference intent
 * (primary / surface / text-muted) rather than raw hex values.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D97706", // chai amber
          dark: "#B45309",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#0D9488", // teal
          foreground: "#FFFFFF",
        },
        background: "#FAF7F2", // warm cream
        surface: "#FFFFFF",
        text: {
          DEFAULT: "#1C1917", // warm near-black
          muted: "#78716C",
        },
        border: "#E7E5E4",
        success: "#16A34A",
        warning: "#F59E0B",
        error: "#DC2626",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(28 25 23 / 0.04), 0 1px 3px 0 rgb(28 25 23 / 0.06)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
