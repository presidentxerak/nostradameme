import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSpotPrice, getVolatilityPct } from "@/lib/coingecko/service";
import { generateThreshold } from "@/lib/markets/thresholds";
import { generateQuestion } from "@/lib/markets/questions";
import { getMarketQuote } from "@/lib/oracle/quotes";
import { AppError } from "@/lib/utils/errors";
import {
  hourlySlotStart,
  hourlySlotEnd,
  hourToSlotName,
} from "@/lib/utils/dates";
import type { MarketSlot, SupportedAssetRow } from "@/types/db";
import type { GeneratedMarket } from "@/lib/markets/types";

async function pickAsset(hour: number): Promise<SupportedAssetRow> {
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
  const idx = hour % assets.length;
  return assets[idx]!;
}

export async function generateHourlyMarket(
  triggerSource: string,
): Promise<GeneratedMarket> {
  const admin = getAdminSupabase();
  const now = new Date();
  const startAt = hourlySlotStart(now);
  const endAt = hourlySlotEnd(now);
  const utcHour = now.getUTCHours();
  const slot = hourToSlotName(utcHour);

  const { data: existing } = await admin
    .from("markets")
    .select("id")
    .eq("start_at", startAt.toISOString())
    .maybeSingle();
  if (existing) {
    throw new AppError("already_exists", "Market already exists for this hour", 409);
  }

  const { data: runRow } = await admin
    .from("market_generation_runs")
    .insert({ status: "started", trigger_source: triggerSource })
    .select("id")
    .single();
  const runId = (runRow as { id: string } | null)?.id ?? null;

  try {
    const asset = await pickAsset(utcHour);
    const spot = await getSpotPrice(asset.coingecko_id);
    if (!spot || spot <= 0) {
      throw new AppError("no_spot_price", "Could not fetch spot price", 502);
    }
    const volatility = await getVolatilityPct(asset.coingecko_id, 7);
    const { thresholdPrice, operator } = generateThreshold(spot, volatility, slot);
    const question = generateQuestion(asset.asset_key, slot, operator, thresholdPrice, endAt);
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
        end_at: endAt.toISOString(),
        source_snapshot: {
          spotPrice: spot,
          volatility,
          utcHour,
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
      sourceSnapshot: { spotPrice: spot, volatility, utcHour },
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
  triggerSource: string,
): Promise<GeneratedMarket> {
  return generateHourlyMarket(triggerSource);
}
