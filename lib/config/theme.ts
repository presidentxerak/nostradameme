export const THEME = {
  colors: {
    background: "#06060c",
    surface: "#0e0e18",
    border: "#1a1a2e",
    accent: "#8b5cf6",
    accentGlow: "#a78bfa",
    yes: "#00e5a0",
    yesGlow: "#00ffbb",
    no: "#ff2d7a",
    noGlow: "#ff5ca1",
    gold: "#f59e0b",
    goldGlow: "#fbbf24",
    textPrimary: "#f0f0f5",
    textSecondary: "#8b8ba0",
    textMuted: "#4a4a60",
  },
  fonts: {
    display: "Cinzel Decorative, Cinzel, serif",
    body: "Inter, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
} as const;

export type Theme = typeof THEME;
