import type { MarketSlot } from "@/types/db";
import type { Operator } from "@/lib/markets/types";
import type { Duration } from "@/lib/markets/generator";

function formatAmount(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US")}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

const DURATION_TEXT: Record<Duration, string> = {
  "24h": "in 24 hours",
  "7d": "in 7 days",
  "1m": "in 1 month",
  "3m": "in 3 months",
  "6m": "in 6 months",
  "1y": "in 1 year",
};

export function generateQuestion(
  asset: string,
  _slot: MarketSlot,
  operator: Operator,
  threshold: number,
  _endAt: Date,
  duration: Duration,
): string {
  const direction = operator === "gte" ? "above" : "below";
  const amt = formatAmount(threshold);
  const timeframe = DURATION_TEXT[duration];
  return `Will ${asset} trade ${direction} ${amt} ${timeframe}?`;
}
