import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { getClosingPrice } from "@/lib/coingecko/service";
import { AppError } from "@/lib/utils/errors";
import type { MarketRow, MarketSide, SupportedAssetRow } from "@/types/db";

export interface ResolveMarketResult {
  marketId: string;
  closingPrice: number;
  resolutionSide: MarketSide;
}

export function computeResolution(
  closingPrice: number,
  thresholdPrice: number,
  operator: "gte" | "lte",
): MarketSide {
  if (operator === "gte") {
    return closingPrice >= thresholdPrice ? "yes" : "no";
  }
  return closingPrice <= thresholdPrice ? "yes" : "no";
}

export async function resolveMarket(
  marketId: string,
): Promise<ResolveMarketResult> {
  const admin = getAdminSupabase();
  const { data: runRow } = await admin
    .from("market_resolution_runs")
    .insert({
      market_id: marketId,
      status: "started",
    })
    .select("id")
    .single();
  const runId = (runRow as { id: string } | null)?.id ?? null;

  try {
    const { data: marketRaw, error: marketErr } = await admin
      .from("markets")
      .select("*, asset:supported_assets!markets_asset_id_fkey(*)")
      .eq("id", marketId)
      .maybeSingle();
    if (marketErr || !marketRaw) {
      throw new AppError("market_not_found", marketErr?.message ?? "no market", 404);
    }
    const market = marketRaw as MarketRow & { asset: SupportedAssetRow };

    if (market.status === "resolved") {
      throw new AppError("already_resolved", "Market already resolved", 409);
    }

    const closingPrice = await getClosingPrice(market.asset.coingecko_id);
    if (!closingPrice || closingPrice <= 0) {
      throw new AppError("no_closing_price", "Could not fetch closing price", 502);
    }

    const resolutionSide = computeResolution(
      closingPrice,
      Number(market.threshold_price),
      market.operator,
    );

    await admin
      .from("markets")
      .update({
        status: "resolved",
        closing_price: closingPrice,
        resolution_side: resolutionSide,
        updated_at: new Date().toISOString(),
      })
      .eq("id", marketId);

    if (runId) {
      await admin
        .from("market_resolution_runs")
        .update({
          status: "succeeded",
          closing_price: closingPrice,
          resolution_side: resolutionSide,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
    }

    return { marketId, closingPrice, resolutionSide };
  } catch (err) {
    if (runId) {
      await admin
        .from("market_resolution_runs")
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
