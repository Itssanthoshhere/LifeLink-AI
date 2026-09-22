import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ops: {
          bg: "#0B0F17",
          panel: "#111827",
          card: "#161F30",
          cardHover: "#1E2A3E",
          border: "#202E42",
          borderLight: "#2E4059",
          text: "#F8FAFC",
          muted: "#94A3B8",
          dim: "#64748B",
          cyan: "#06B6D4",
          blue: "#38BDF8",
          emerald: "#10B981",
          amber: "#F59E0B",
          crimson: "#EF4444",
          purple: "#A855F7"
        }
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "monospace"],
      }
    },
  },
  plugins: [],
};
export default config;
