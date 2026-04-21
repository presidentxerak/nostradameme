import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";
import { XRPL_CONFIG } from "@/lib/config/xrpl";
import type { MarketRow, PositionRow } from "@/types/db";
import type { BetRequest, BetResult } from "@/types/app";
import { isLocked } from "@/lib/utils/dates";

export async function getUserBalance(userId: string): Promise<number> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("user_balance")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return Number((data as { balance?: number } | null)?.balance ?? 0);
}

export async function createPosition(
  userId: string,
  req: BetRequest,
): Promise<BetResult> {
  const admin = getAdminSupabase();
  const amount = Number(req.amount);
  if (!Number.isFinite(amount) || amount < XRPL_CONFIG.MIN_BET_USD) {
    throw new AppError("bad_amount", "Minimum bet is $1", 400);
  }
  if (amount > XRPL_CONFIG.MAX_BET_USD) {
    throw new AppError("bad_amount", "Maximum bet is $500", 400);
  }

  const { data: marketRaw, error } = await admin
    .from("markets")
    .select("*")
    .eq("id", req.marketId)
    .maybeSingle();
  if (error || !marketRaw) {
    throw new AppError("market_not_found", "Market not found", 404);
  }
  const market = marketRaw as MarketRow;
  if (market.status !== "open") {
    throw new AppError("market_not_open", "Prophecy is not open", 400);
  }
  const bettingEnd = (market as MarketRow & { betting_end_at?: string }).betting_end_at ?? market.end_at;
  if (isLocked(bettingEnd)) {
    throw new AppError("market_locked", "Betting is closed", 400);
  }

  const { data: existing } = await admin
    .from("positions")
    .select("id")
    .eq("user_id", userId)
    .eq("market_id", req.marketId)
    .maybeSingle();
  if (existing) {
    throw new AppError(
      "already_bet",
      "You already predicted on this prophecy",
      409,
    );
  }

  const balance = await getUserBalance(userId);
  if (balance < amount) {
    throw new AppError("insufficient_balance", "Not enough funds", 402);
  }

  const { data: positionRaw, error: insertErr } = await admin
    .from("positions")
    .insert({
      user_id: userId,
      market_id: req.marketId,
      side: req.side,
      amount,
      funded: true,
      funded_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (insertErr || !positionRaw) {
    throw new AppError(
      "position_insert_failed",
      insertErr?.message ?? "Failed",
      500,
    );
  }
  const position = positionRaw as PositionRow;

  const newBalance = balance - amount;
  await admin.from("internal_wallet_ledger").insert({
    user_id: userId,
    entry_type: "bet",
    amount: -amount,
    reference_type: "position",
    reference_id: position.id,
    balance_after: newBalance,
  });

  return { positionId: position.id, newBalance };
}
