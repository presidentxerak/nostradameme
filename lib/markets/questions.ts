import type { MarketSlot } from "@/types/db";
import type { Operator } from "@/lib/markets/types";

function formatAmount(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US")}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatHour(endAt: Date): string {
  const h = endAt.getUTCHours();
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${suffix} UTC`;
}

export function generateQuestion(
  asset: string,
  _slot: MarketSlot,
  operator: Operator,
  threshold: number,
  endAt: Date,
): string {
  const direction = operator === "gte" ? "above" : "below";
  const amt = formatAmount(threshold);
  const time = formatHour(endAt);
  return `Will ${asset} trade ${direction} ${amt} by ${time}?`;
}
