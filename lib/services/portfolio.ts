import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import type {
  MarketRow,
  PositionRow,
  SupportedAssetRow,
} from "@/types/db";
import type { HistoryEntry } from "@/types/app";

export async function getUserHistory(
  userId: string,
  limit = 50,
  offset = 0,
): Promise<HistoryEntry[]> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("positions")
    .select(
      "*, market:markets!positions_market_id_fkey(*, asset:supported_assets!markets_asset_id_fkey(*)), payouts(net_amount, status)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const rows = (data ?? []) as Array<
    PositionRow & {
      market: MarketRow & { asset: SupportedAssetRow };
      payouts: Array<{ net_amount: number | string; status: string }> | null;
    }
  >;

  return rows.map((r) => {
    const resolved = r.market.status === "resolved";
    const userWon = resolved ? r.market.resolution_side === r.side : null;
    const payout =
      r.payouts && r.payouts.length > 0 ? Number(r.payouts[0]!.net_amount) : null;
    return {
      id: r.id,
      marketId: r.market_id,
      slot: r.market.slot,
      assetKey: r.market.asset.asset_key,
      question: r.market.question,
      side: r.side,
      amount: Number(r.amount),
      marketStatus: r.market.status,
      resolutionSide: r.market.resolution_side,
      userWon,
      netPayout: userWon && payout ? payout : userWon === false ? 0 : null,
      createdAt: r.created_at,
      endAt: r.market.end_at,
    };
  });
}
