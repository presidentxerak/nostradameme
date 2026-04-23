import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSpotPrice, getVolatilityPct } from "@/lib/coingecko/service";
import { generateThreshold } from "@/lib/markets/thresholds";
import { generateQuestion } from "@/lib/markets/questions";
import { getMarketQuote } from "@/lib/oracle/quotes";
import { AppError } from "@/lib/utils/errors";
import { hourToSlotName } from "@/lib/utils/dates";
import type { MarketSlot, SupportedAssetRow } from "@/types/db";
import type { GeneratedMarket } from "@/lib/markets/types";

const BETTING_WINDOW_MS = 3 * 60 * 1000;

export type Duration = "24h" | "7d" | "1m" | "3m" | "6m" | "1y";

const DURATION_MS: Record<Duration, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "1m": 30 * 24 * 60 * 60 * 1000,
  "3m": 90 * 24 * 60 * 60 * 1000,
  "6m": 180 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
};

export const DURATION_LABELS: Record<Duration, string> = {
  "24h": "24h",
  "7d": "7 days",
  "1m": "1 month",
  "3m": "3 months",
  "6m": "6 months",
  "1y": "1 year",
};

const DURATIONS: Duration[] = ["24h", "7d", "1m", "3m", "6m"];

function pickDuration(seed: number): Duration {
  const weights = [30, 25, 20, 15, 10];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = seed * total;
  for (let i = 0; i < DURATIONS.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return DURATIONS[i]!;
  }
  return "24h";
}

function bettingSlotStart(date = new Date()): Date {
  const ms = date.getTime();
  return new Date(Math.floor(ms / BETTING_WINDOW_MS) * BETTING_WINDOW_MS);
}

async function pickAsset(hour: number, minute: number): Promise<SupportedAssetRow> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("supported_assets")
    .select("*")
    .eq("enabled", true)
    .order("display_order", { ascending: true });
  if (error) throw new AppError("db_error", error.message, 500);
  const assets = (data ?? []) as SupportedAssetRow[];
  if (assets.length === 0) {
    throw new AppError("no_assets", "No enabled assets configured", 500);
  }
  const idx = (hour * 3 + Math.floor(minute / 20)) % assets.length;
  return assets[idx]!;
}

export async function generateHourlyMarket(
  triggerSource: string,
): Promise<GeneratedMarket> {
  const admin = getAdminSupabase();
  const now = new Date();
  const startAt = bettingSlotStart(now);
  const bettingEndAt = new Date(startAt.getTime() + BETTING_WINDOW_MS);
  const utcHour = now.getUTCHours();
  const slot = hourToSlotName(utcHour);

  const { data: existing } = await admin
    .from("markets")
    .select("id")
    .eq("start_at", startAt.toISOString())
    .maybeSingle();
  if (existing) {
    throw new AppError("already_exists", "Market already exists for this slot", 409);
  }

  const duration = pickDuration(Math.random());
  const endAt = new Date(startAt.getTime() + DURATION_MS[duration]);

  const { data: runRow } = await admin
    .from("market_generation_runs")
    .insert({ status: "started", trigger_source: triggerSource })
    .select("id")
    .single();
  const runId = (runRow as { id: string } | null)?.id ?? null;

  try {
    const asset = await pickAsset(utcHour, now.getUTCMinutes());
    const spot = await getSpotPrice(asset.coingecko_id);
    if (!spot || spot <= 0) {
      throw new AppError("no_spot_price", "Could not fetch spot price", 502);
    }
    const volatility = await getVolatilityPct(asset.coingecko_id, 7);
    const { thresholdPrice, operator } = generateThreshold(spot, volatility, slot);
    const question = generateQuestion(asset.asset_key, slot, operator, thresholdPrice, endAt, duration);
    const marketId = crypto.randomUUID();
    const oracleQuote = getMarketQuote(marketId);

    const { error: insertErr } = await admin
      .from("markets")
      .insert({
        id: marketId,
        slot,
        asset_id: asset.id,
        question,
        oracle_quote: oracleQuote,
        threshold_price: thresholdPrice,
        operator,
        opening_spot_price: spot,
        status: "open",
        start_at: startAt.toISOString(),
        betting_end_at: bettingEndAt.toISOString(),
        end_at: endAt.toISOString(),
        duration,
        source_snapshot: {
          spotPrice: spot,
          volatility,
          utcHour,
          duration,
          generatedAt: new Date().toISOString(),
          triggerSource,
        },
      });
    if (insertErr) {
      throw new AppError("db_insert_market", insertErr.message, 500);
    }
    if (runId) {
      await admin
        .from("market_generation_runs")
        .update({ market_id: marketId, status: "succeeded", finished_at: new Date().toISOString() })
        .eq("id", runId);
    }
    return {
      slot, assetId: asset.id, question, oracleQuote, thresholdPrice, operator,
      openingSpotPrice: spot, startAt: startAt.toISOString(), endAt: endAt.toISOString(),
      sourceSnapshot: { spotPrice: spot, volatility, utcHour, duration },
    };
  } catch (err) {
    if (runId) {
      await admin.from("market_generation_runs").update({
        status: "failed", error_message: err instanceof Error ? err.message : String(err),
        finished_at: new Date().toISOString(),
      }).eq("id", runId);
    }
    throw err;
  }
}

export async function generateMarketForSlot(
  _slot: MarketSlot,
): Promise<GeneratedMarket> {
  return generateHourlyMarket("manual-slot");
}
