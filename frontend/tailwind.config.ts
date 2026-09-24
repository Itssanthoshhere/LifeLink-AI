import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#a4161a",
          dark: "#8b1116",
          light: "#c62828",
          50: "#fef2f2",
          100: "#fde8e8",
        },
        gold: {
          DEFAULT: "#d4af37",
          light: "#fef3c7",
        },
        charcoal: "#111827",
        surface: "#f9fafb",
        card: {
          DEFAULT: "#ffffff",
          hover: "#f8fafc",
        },
        muted: {
          DEFAULT: "#6b7280",
          bg: "#f3f4f6",
          foreground: "#4b5563",
        },
        ll: {
          bg: "#faf9f7",
          panel: "#ffffff",
          border: "#e5e7eb",
          borderLight: "#f3f4f6",
          text: "#111827",
          dim: "#9ca3af",
          crimson: "#a4161a",
          rose: "#e11d48",
          emerald: "#059669",
          amber: "#d97706",
          blue: "#2563eb",
          cyan: "#0891b2",
          purple: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        'card': '20px',
        'card-sm': '14px',
        'card-lg': '26px',
        'panel': '24px',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 8px 40px rgba(16, 24, 40, 0.1)',
        'panel': '0 16px 64px rgba(16, 24, 40, 0.08)',
        'glow-crimson': '0 4px 20px rgba(164, 22, 26, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
