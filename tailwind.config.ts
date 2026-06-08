import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#050505",
        graphite: "#111317",
        alloy: "#1d2229",
        signal: "#ff2a2a",
        warning: "#d89f35",
        frost: "#d7e0e7",
        "bat-glow": {
          50: "#fff1f1",
          100: "#ffe1e1",
          200: "#ffc7c7",
          300: "#ffa0a0",
          400: "#ff5252",
          500: "#ff2a2a",
          600: "#ed0808",
          700: "#c80202",
          800: "#a50808",
          900: "#880e0e",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "SFMono-Regular",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        console:
          "0 0 0 1px rgba(255,255,255,0.08), 0 22px 70px rgba(0,0,0,0.65)",
        "glow-red":
          "0 0 20px rgba(255,42,42,0.3), 0 0 60px rgba(255,42,42,0.1)",
        "glow-amber":
          "0 0 20px rgba(216,159,53,0.3), 0 0 60px rgba(216,159,53,0.1)",
        "panel-hover":
          "0 0 0 1px rgba(255,42,42,0.2), 0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(255,42,42,0.08)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 8px rgba(255,42,42,0.4), 0 0 24px rgba(255,42,42,0.15)",
          },
          "50%": {
            boxShadow: "0 0 16px rgba(255,42,42,0.6), 0 0 48px rgba(255,42,42,0.25)",
          },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        flicker: {
          "0%": { opacity: "1" },
          "4%": { opacity: "0.9" },
          "6%": { opacity: "1" },
          "12%": { opacity: "0.92" },
          "14%": { opacity: "1" },
          "20%": { opacity: "0.88" },
          "22%": { opacity: "1" },
          "34%": { opacity: "0.95" },
          "36%": { opacity: "1" },
          "100%": { opacity: "1" },
        },
        "scan-sweep": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "meter-fill": {
          "0%": { width: "0%" },
          "100%": { width: "var(--meter-target)" },
        },
        "meter-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "boot-text": {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "counter-glow": {
          "0%, 100%": {
            textShadow: "0 0 20px rgba(255,42,42,0.3), 0 0 40px rgba(255,42,42,0.1)",
          },
          "50%": {
            textShadow: "0 0 30px rgba(255,42,42,0.5), 0 0 60px rgba(255,42,42,0.2)",
          },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        flicker: "flicker 4s linear infinite",
        "scan-sweep": "scan-sweep 8s linear infinite",
        "meter-fill": "meter-fill 1.2s ease-out forwards",
        "meter-shimmer": "meter-shimmer 2s linear infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "boot-text": "boot-text 0.3s ease-out forwards",
        "counter-glow": "counter-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
