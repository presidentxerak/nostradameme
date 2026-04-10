import "server-only";

import { fetchSimplePrice, fetchMarketChart } from "@/lib/coingecko/client";
import { cacheGet, cacheSet } from "@/lib/coingecko/cache";

const SPOT_TTL_MS = 20 * 1000;
const VOLATILITY_TTL_MS = 5 * 60 * 1000;

export async function getSpotPrice(
  coingeckoId: string,
): Promise<number | null> {
  const cacheKey = `spot:${coingeckoId}`;
  const cached = cacheGet<number>(cacheKey);
  if (cached !== null) return cached;
  const result = await fetchSimplePrice([coingeckoId]);
  const price = result[coingeckoId];
  if (typeof price === "number") {
    cacheSet(cacheKey, price, SPOT_TTL_MS);
    return price;
  }
  return null;
}

export async function getVolatilityPct(
  coingeckoId: string,
  days = 7,
): Promise<number> {
  const cacheKey = `vol:${coingeckoId}:${days}`;
  const cached = cacheGet<number>(cacheKey);
  if (cached !== null) return cached;
  const chart = await fetchMarketChart(coingeckoId, days);
  if (chart.prices.length < 2) return 0.01;
  const prices = chart.prices.map((p) => p[1]);
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const curr = prices[i];
    if (typeof prev !== "number" || typeof curr !== "number" || prev <= 0)
      continue;
    returns.push((curr - prev) / prev);
  }
  if (returns.length === 0) return 0.01;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + (r - mean) * (r - mean), 0) /
    returns.length;
  const stddev = Math.sqrt(variance);
  cacheSet(cacheKey, stddev, VOLATILITY_TTL_MS);
  return stddev;
}

export async function getClosingPrice(
  coingeckoId: string,
): Promise<number | null> {
  // Closing price = latest spot price at the time of resolution.
  return getSpotPrice(coingeckoId);
}
