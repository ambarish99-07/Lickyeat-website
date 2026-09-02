import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Site palette — warm, appetising, brand-neutral.
        cream: "#fdf9f3",
        sand: "#f4ece0",
        ink: "#211b17",
        charcoal: "#3d352e",
        muted: "#8a7d70",
        line: "#e7ddd980",

        // Per-brand, driven by CSS variables that <BrandTheme> sets.
        // Fall back to a warm default so non-brand pages still render.
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          accent: "rgb(var(--brand-accent) / <alpha-value>)",
          ink: "rgb(var(--brand-ink) / <alpha-value>)",
          soft: "rgb(var(--brand) / 0.10)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(33 27 23 / 0.04), 0 8px 24px -12px rgb(33 27 23 / 0.12)",
        lift: "0 2px 6px rgb(33 27 23 / 0.06), 0 24px 48px -20px rgb(33 27 23 / 0.22)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease both",
      },
    },
  },
  plugins: [],
} satisfies Config;
