import type { MarketSlot } from "@/types/db";
import type { Operator } from "@/lib/markets/types";

function formatAmount(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString("en-US")}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function generateQuestion(
  asset: string,
  slot: MarketSlot,
  operator: Operator,
  threshold: number,
  _endAt: Date,
): string {
  const direction = operator === "gte" ? "above" : "below";
  const amt = formatAmount(threshold);
  if (slot === "morning") {
    return `Will ${asset} trade ${direction} ${amt} at dawn tomorrow?`;
  }
  if (slot === "noon") {
    return `Will ${asset} be ${direction} ${amt} by the noonday sun?`;
  }
  if (slot === "night") {
    return `Will ${asset} close ${direction} ${amt} by Night's end?`;
  }
  return `Will ${asset} remain ${direction} ${amt} by weekly close?`;
}
