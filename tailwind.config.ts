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
        shell: "#07080a",
        panel: "#0d0f14",
        panel2: "#11141b",
        line: "#252932",
        ember: "#ff454b",
        amber: "#ffae21",
        cobalt: "#3d8bff",
        violet: "#a855f7",
        mint: "#19d39b",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 42px rgba(255, 69, 75, 0.22)",
        blueglow: "0 0 28px rgba(61, 139, 255, 0.22)",
      },
      keyframes: {
        sweep: { "0%": { transform: "translateX(-110%)" }, "100%": { transform: "translateX(110%)" } },
        pulseRing: { "0%, 100%": { opacity: "0.65", transform: "scale(1)" }, "50%": { opacity: "1", transform: "scale(1.04)" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        sweep: "sweep 2.4s linear infinite",
        pulseRing: "pulseRing 2.5s ease-in-out infinite",
        fadeUp: "fadeUp 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
