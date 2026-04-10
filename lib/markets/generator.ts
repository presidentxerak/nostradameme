import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSpotPrice, getVolatilityPct } from "@/lib/coingecko/service";
import { generateThreshold } from "@/lib/markets/thresholds";
import { generateQuestion } from "@/lib/markets/questions";
import { getMarketQuote } from "@/lib/oracle/quotes";
import { AppError } from "@/lib/utils/errors";
import {
  slotEndUtc,
  slotStartUtc,
  weekEndUtc,
  weekStartUtc,
} from "@/lib/utils/dates";
import type { MarketSlot, SupportedAssetRow } from "@/types/db";
import type { GeneratedMarket } from "@/lib/markets/types";

async function pickAsset(): Promise<SupportedAssetRow> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("supported_assets")
    .select("*")
    .eq("enabled", true)
    .order("display_order", { ascending: true });
  if (error)
    throw new AppError("db_error", error.message, 500);
  const assets = (data ?? []) as SupportedAssetRow[];
  if (assets.length === 0) {
    throw new AppError("no_assets", "No enabled assets configured", 500);
  }
  const idx = Math.floor(Math.random() * assets.length);
  return assets[idx]!;
}

export async function generateMarketForSlot(
  slot: MarketSlot,
  triggerSource: string,
): Promise<GeneratedMarket> {
  const admin = getAdminSupabase();

  // Log run start.
  const { data: runRow } = await admin
    .from("market_generation_runs")
    .insert({
      status: "started",
      trigger_source: triggerSource,
    })
    .select("id")
    .single();
  const runId = (runRow as { id: string } | null)?.id ?? null;

  try {
    const asset = await pickAsset();
    const spot = await getSpotPrice(asset.coingecko_id);
    if (!spot || spot <= 0) {
      throw new AppError("no_spot_price", "Could not fetch spot price", 502);
    }
    const volatility = await getVolatilityPct(asset.coingecko_id, 7);
    const { thresholdPrice, operator } = generateThreshold(
      spot,
      volatility,
      slot,
    );

    const now = new Date();
    let startAt: Date;
    let endAt: Date;
    if (slot === "weekly") {
      startAt = weekStartUtc(now);
      endAt = weekEndUtc(now);
    } else {
      startAt = slotStartUtc(slot, now);
      endAt = slotEndUtc(slot, now);
    }

    const question = generateQuestion(
      asset.asset_key,
      slot,
      operator,
      thresholdPrice,
      endAt,
    );
    const tempMarketId = crypto.randomUUID();
    const oracleQuote = getMarketQuote(tempMarketId);

    const inserted = await admin
      .from("markets")
      .insert({
        id: tempMarketId,
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
          generatedAt: new Date().toISOString(),
          triggerSource,
        },
      })
      .select("*")
      .single();

    if (inserted.error) {
      throw new AppError("db_insert_market", inserted.error.message, 500);
    }

    if (runId) {
      await admin
        .from("market_generation_runs")
        .update({
          market_id: tempMarketId,
          status: "succeeded",
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    return {
      slot,
      assetId: asset.id,
      question,
      oracleQuote,
      thresholdPrice,
      operator,
      openingSpotPrice: spot,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      sourceSnapshot: {
        spotPrice: spot,
        volatility,
      },
    };
  } catch (err) {
    if (runId) {
      await admin
        .from("market_generation_runs")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }
    throw err;
  }
}
