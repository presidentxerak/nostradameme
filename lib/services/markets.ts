import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { calculatePct } from "@/lib/utils/currency";
import { generateMemeUsername } from "@/lib/utils/meme-names";
import type {
  MarketRow,
  PositionRow,
  SupportedAssetRow,
} from "@/types/db";
import type { LiveFeedEntry, MarketPools, MarketWithAsset } from "@/types/app";

export async function getOpenMarketsBySlot(): Promise<
  Record<"morning" | "noon" | "night", MarketWithAsset | null>
> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("markets")
    .select("*, asset:supported_assets!markets_asset_id_fkey(*)")
    .in("status", ["open", "locked"])
    .in("slot", ["morning", "noon", "night"])
    .order("end_at", { ascending: true });
  const rows = (data ?? []) as Array<MarketRow & { asset: SupportedAssetRow }>;
  const out: Record<"morning" | "noon" | "night", MarketWithAsset | null> = {
    morning: null,
    noon: null,
    night: null,
  };
  for (const r of rows) {
    if (r.slot === "morning" || r.slot === "noon" || r.slot === "night") {
      if (!out[r.slot]) out[r.slot] = r;
    }
  }
  return out;
}

export async function getMarketById(
  marketId: string,
): Promise<MarketWithAsset | null> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("markets")
    .select("*, asset:supported_assets!markets_asset_id_fkey(*)")
    .eq("id", marketId)
    .maybeSingle();
  if (!data) return null;
  return data as MarketWithAsset;
}

export async function getMarketPools(
  marketId: string,
): Promise<MarketPools> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("market_pools")
    .select("*")
    .eq("market_id", marketId)
    .maybeSingle();
  const row = data as
    | {
        market_id: string;
        yes_pool: number | string;
        no_pool: number | string;
        total_volume: number | string;
        last_bet_at: string | null;
      }
    | null;
  const yes = Number(row?.yes_pool ?? 0);
  const no = Number(row?.no_pool ?? 0);
  const total = Number(row?.total_volume ?? yes + no);
  return {
    marketId,
    yesPool: yes,
    noPool: no,
    totalVolume: total,
    yesPct: calculatePct(yes, total || 1),
    noPct: calculatePct(no, total || 1),
    lastBetAt: row?.last_bet_at ?? null,
  };
}

export async function getMarketFeed(
  marketId: string,
  limit = 20,
): Promise<LiveFeedEntry[]> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("positions")
    .select("id, user_id, side, amount, created_at, funded")
    .eq("market_id", marketId)
    .eq("funded", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as Array<{
    id: string;
    user_id: string;
    side: "yes" | "no";
    amount: number | string;
    created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    username: generateMemeUsername(r.user_id),
    side: r.side,
    amount: Number(r.amount),
    createdAt: r.created_at,
  }));
}

export async function getUserPositionForMarket(
  userId: string,
  marketId: string,
): Promise<PositionRow | null> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("positions")
    .select("*")
    .eq("user_id", userId)
    .eq("market_id", marketId)
    .maybeSingle();
  return (data as PositionRow | null) ?? null;
}
