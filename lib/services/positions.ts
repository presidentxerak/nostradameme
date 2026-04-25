import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";
import { XRPL_CONFIG } from "@/lib/config/xrpl";
import type { MarketRow, PositionRow } from "@/types/db";
import type { BetRequest, BetResult } from "@/types/app";
import { msUntil } from "@/lib/utils/dates";

const BETTING_BUFFER_MS = 3000;

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
  const roundedAmount = Math.round(amount * 100) / 100;

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
  const bettingEnd = market.betting_end_at ?? market.end_at;
  if (msUntil(bettingEnd) <= BETTING_BUFFER_MS) {
    throw new AppError("market_locked", "Betting is closing. Try the next prediction.", 400);
  }

  const { data: existing } = await admin
    .from("positions")
    .select("id")
    .eq("user_id", userId)
    .eq("market_id", req.marketId)
    .maybeSingle();
  if (existing) {
    throw new AppError("already_bet", "You already predicted on this prophecy", 409);
  }

  const balance = await getUserBalance(userId);
  if (balance < roundedAmount) {
    throw new AppError("insufficient_balance", "Not enough funds", 402);
  }

  const newBalance = Math.round((balance - roundedAmount) * 100) / 100;

  const { data: ledgerRow, error: ledgerErr } = await admin
    .from("internal_wallet_ledger")
    .insert({
      user_id: userId,
      entry_type: "bet",
      amount: -roundedAmount,
      reference_type: "position_pending",
      reference_id: req.marketId,
      balance_after: newBalance,
    })
    .select("id")
    .single();
  if (ledgerErr || !ledgerRow) {
    throw new AppError("ledger_failed", "Balance update failed", 500);
  }

  const balanceAfterDeduct = await getUserBalance(userId);
  if (balanceAfterDeduct < 0) {
    await admin
      .from("internal_wallet_ledger")
      .delete()
      .eq("id", (ledgerRow as { id: string }).id);
    throw new AppError("insufficient_balance", "Not enough funds (concurrent request)", 402);
  }

  const { data: positionRaw, error: insertErr } = await admin
    .from("positions")
    .insert({
      user_id: userId,
      market_id: req.marketId,
      side: req.side,
      amount: roundedAmount,
      funded: true,
      funded_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (insertErr || !positionRaw) {
    await admin
      .from("internal_wallet_ledger")
      .delete()
      .eq("id", (ledgerRow as { id: string }).id);
    throw new AppError("position_insert_failed", insertErr?.message ?? "Failed", 500);
  }
  const position = positionRaw as PositionRow;

  await admin
    .from("internal_wallet_ledger")
    .update({ reference_type: "position", reference_id: position.id })
    .eq("id", (ledgerRow as { id: string }).id);

  return { positionId: position.id, newBalance };
}
