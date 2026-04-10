export const THEME = {
  colors: {
    background: "#0a0a0f",
    surface: "#12121a",
    border: "#1e1e2e",
    accent: "#7c3aed",
    accentGlow: "#9d5cf0",
    yes: "#10b981",
    yesGlow: "#34d399",
    no: "#ef4444",
    noGlow: "#f87171",
    gold: "#f59e0b",
    goldGlow: "#fbbf24",
    memePurple: "#a855f7",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#475569",
  },
  fonts: {
    display: "Cinzel, serif",
    body: "Inter, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
} as const;

export type Theme = typeof THEME;
