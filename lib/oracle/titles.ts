import type { OracleTitle } from "@/types/app";

export const ORACLE_TITLES: readonly OracleTitle[] = [
  { min: 0, max: 20, title: "\ud83d\udc23 Blind Prophet", color: "#94a3b8" },
  { min: 20, max: 40, title: "\ud83d\udc38 Apprentice Seer", color: "#6b7280" },
  { min: 40, max: 55, title: "\ud83d\udc41\ufe0f The Lurker", color: "#7c3aed" },
  { min: 55, max: 65, title: "\ud83d\udd2e True Oracle", color: "#8b5cf6" },
  { min: 65, max: 75, title: "\u26a1 Enlightened One", color: "#a78bfa" },
  { min: 75, max: 85, title: "\ud83c\udf1f Grand Seer", color: "#f59e0b" },
  { min: 85, max: 101, title: "\ud83d\udc80 Nostradameme Himself", color: "#ef4444" },
] as const;

export const DEFAULT_TITLE: OracleTitle = {
  title: "\ud83d\udd2e Seeker",
  color: "#94a3b8",
  min: 0,
  max: 0,
};

export const MIN_PREDICTIONS_FOR_TITLE = 5;

export function getOracleTitle(
  winRate: number,
  totalPredictions: number,
): OracleTitle {
  if (totalPredictions < MIN_PREDICTIONS_FOR_TITLE) return DEFAULT_TITLE;
  const pct = Math.max(0, Math.min(100, winRate));
  const found = ORACLE_TITLES.find((t) => pct >= t.min && pct < t.max);
  return found ?? DEFAULT_TITLE;
}

export function getOracleTitleString(
  winRate: number,
  totalPredictions: number,
): string {
  return getOracleTitle(winRate, totalPredictions).title;
}
