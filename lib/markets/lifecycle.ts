import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { resolveMarket } from "@/lib/markets/resolver";
import { executePayouts } from "@/lib/payouts/executor";
import type { MarketRow } from "@/types/db";

export interface ResolveDueResult {
  marketsResolved: number;
  errors: Array<{ marketId: string; error: string }>;
}

export async function resolveDueMarkets(): Promise<ResolveDueResult> {
  const admin = getAdminSupabase();
  const now = new Date().toISOString();
  const { data } = await admin
    .from("markets")
    .select("*")
    .in("status", ["open", "locked", "resolve_pending"])
    .lte("end_at", now);

  const rows = (data ?? []) as MarketRow[];
  const errors: Array<{ marketId: string; error: string }> = [];
  let resolved = 0;

  for (const row of rows) {
    try {
      await resolveMarket(row.id);
      await executePayouts(row.id);
      resolved++;
    } catch (err) {
      errors.push({
        marketId: row.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { marketsResolved: resolved, errors };
}

export async function lockMarketsApproachingEnd(): Promise<number> {
  const admin = getAdminSupabase();
  const now = new Date().toISOString();
  const { data } = await admin
    .from("markets")
    .update({
      status: "locked",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "open")
    .lte("betting_end_at", now)
    .select("id");
  return (data ?? []).length;
}

export async function cancelMarket(marketId: string): Promise<void> {
  const admin = getAdminSupabase();
  await admin
    .from("markets")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("id", marketId);
  const { data: positions } = await admin
    .from("positions")
    .select("*")
    .eq("market_id", marketId)
    .eq("funded", true);
  for (const p of positions ?? []) {
    const pos = p as {
      id: string;
      user_id: string;
      amount: number | string;
    };
    const { data: bal } = await admin
      .from("user_balance")
      .select("balance")
      .eq("user_id", pos.user_id)
      .maybeSingle();
    const current = Number((bal as { balance?: number } | null)?.balance ?? 0);
    const refund = Number(pos.amount);
    await admin.from("internal_wallet_ledger").insert({
      user_id: pos.user_id,
      entry_type: "refund",
      amount: refund,
      reference_type: "position",
      reference_id: pos.id,
      balance_after: current + refund,
    });
  }
}
