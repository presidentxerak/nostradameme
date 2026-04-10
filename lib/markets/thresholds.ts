import type { MarketSlot } from "@/types/db";
import type { Operator } from "@/lib/markets/types";

export function roundThreshold(value: number): number {
  if (value < 100) return Math.round(value * 100) / 100;
  if (value < 1000) return Math.round(value);
  if (value < 10000) return Math.round(value / 10) * 10;
  return Math.round(value / 100) * 100;
}

/**
 * Generate a threshold with drift proportional to volatility.
 * The slot influences the sign and magnitude:
 *   morning: slight upward drift
 *   noon:    slight downward drift
 *   night:   larger drift (either direction)
 *   weekly:  larger drift (either direction)
 */
export function generateThreshold(
  spotPrice: number,
  volatility: number,
  slot: MarketSlot,
  seed = Math.random(),
): { thresholdPrice: number; operator: Operator } {
  const vol = Math.max(0.005, Math.min(0.25, volatility));
  const slotMultiplier =
    slot === "morning" ? 0.8 : slot === "noon" ? 1 : slot === "night" ? 1.5 : 2;
  const magnitude = vol * slotMultiplier;
  // Use the seed to pick direction deterministically in tests.
  const directionUp = seed >= 0.5;
  const delta = spotPrice * magnitude * (directionUp ? 1 : -1);
  const raw = spotPrice + delta;
  const thresholdPrice = roundThreshold(raw);
  const operator: Operator = directionUp ? "gte" : "lte";
  return { thresholdPrice, operator };
}

export function pickOperatorFromSeed(seed: number): Operator {
  return seed >= 0.5 ? "gte" : "lte";
}
