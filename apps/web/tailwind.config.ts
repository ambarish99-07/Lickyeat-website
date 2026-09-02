import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — driven by CSS variables (see globals.css), so they
        // swap for dark mode automatically.
        cream: "rgb(var(--bg) / <alpha-value>)",
        sand: "rgb(var(--bg-2) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--text) / <alpha-value>)",
        charcoal: "rgb(var(--text-2) / <alpha-value>)",
        muted: "rgb(var(--text-3) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",

        // Per-brand, driven by CSS variables that <BrandTheme> sets.
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          accent: "rgb(var(--brand-accent) / <alpha-value>)",
          ink: "rgb(var(--brand-ink) / <alpha-value>)",
          soft: "rgb(var(--brand) / 0.12)",
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
        card: "0 1px 2px rgb(var(--shadow) / 0.04), 0 8px 24px -12px rgb(var(--shadow) / 0.12)",
        lift: "0 2px 6px rgb(var(--shadow) / 0.06), 0 24px 48px -20px rgb(var(--shadow) / 0.22)",
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
