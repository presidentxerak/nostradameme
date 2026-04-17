import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06060c",
        surface: "#0e0e18",
        border: "#1a1a2e",
        accent: {
          DEFAULT: "#8b5cf6",
          glow: "#a78bfa",
          dim: "#6d28d9",
        },
        yes: {
          DEFAULT: "#00e5a0",
          glow: "#00ffbb",
          dim: "#059669",
          blue: "#06b6d4",
        },
        no: {
          DEFAULT: "#ff2d7a",
          glow: "#ff5ca1",
          dim: "#be185d",
          red: "#ef4444",
        },
        gold: {
          DEFAULT: "#f59e0b",
          glow: "#fbbf24",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#8b8ba0",
          muted: "#4a4a60",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-cinzel)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-yes": "glowYes 2s ease-in-out infinite",
        "glow-no": "glowNo 2s ease-in-out infinite",
        "glow-accent": "glowAccent 3s ease-in-out infinite",
        "ticker": "ticker 40s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowYes: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(0, 229, 160, 0.3), 0 0 30px rgba(6, 182, 212, 0.15)" },
          "50%": { boxShadow: "0 0 25px rgba(0, 255, 187, 0.5), 0 0 50px rgba(6, 182, 212, 0.3)" },
        },
        glowNo: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(255, 45, 122, 0.3), 0 0 30px rgba(239, 68, 68, 0.15)" },
          "50%": { boxShadow: "0 0 25px rgba(255, 92, 161, 0.5), 0 0 50px rgba(239, 68, 68, 0.3)" },
        },
        glowAccent: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(139, 92, 246, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(167, 139, 250, 0.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        ticker: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" },
        },
      },
      backgroundImage: {
        "shimmer-gradient":
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
      },
      backgroundSize: {
        "shimmer-size": "200% 100%",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
