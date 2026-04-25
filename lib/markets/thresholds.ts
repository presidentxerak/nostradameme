import { randomBytes } from "crypto";
import type { MarketSlot } from "@/types/db";
import type { Operator } from "@/lib/markets/types";

export function roundThreshold(value: number): number {
  if (value < 1) return Math.round(value * 10000) / 10000;
  if (value < 100) return Math.round(value * 100) / 100;
  if (value < 1000) return Math.round(value);
  if (value < 10000) return Math.round(value / 10) * 10;
  return Math.round(value / 100) * 100;
}

function cryptoRandom(): number {
  const bytes = randomBytes(4);
  return bytes.readUInt32BE(0) / 0xffffffff;
}

export function generateThreshold(
  spotPrice: number,
  volatility: number,
  slot: MarketSlot,
): { thresholdPrice: number; operator: Operator } {
  const seed = cryptoRandom();
  const jitter = cryptoRandom();
  const vol = Math.max(0.005, Math.min(0.25, volatility));
  const slotMultiplier =
    slot === "morning" ? 0.8 : slot === "noon" ? 1 : slot === "night" ? 1.5 : 2;
  const baseMagnitude = vol * slotMultiplier;
  const magnitude = baseMagnitude * (0.6 + jitter * 0.8);
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
