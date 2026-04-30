import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";
import { XRPL_CONFIG } from "@/lib/config/xrpl";
import type { BetRequest, BetResult } from "@/types/app";

export async function getUserBalance(userId: string): Promise<number> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("user_balance")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return Number((data as { balance?: number } | null)?.balance ?? 0);
}

interface PlaceBetRow {
  position_id: string;
  new_balance: number | string;
}

const PG_ERROR_TO_APP: Record<string, { code: string; message: string; status: number }> = {
  P0001: { code: "bad_amount", message: "Minimum bet is $1", status: 400 },
  P0002: { code: "insufficient_balance", message: "Not enough funds", status: 402 },
  P0003: { code: "market_not_found", message: "Market not found", status: 404 },
  P0004: { code: "market_not_open", message: "Prophecy is not open", status: 400 },
  P0005: {
    code: "market_locked",
    message: "Betting is closing. Try the next prediction.",
    status: 400,
  },
  P0006: {
    code: "already_bet",
    message: "You already predicted on this prophecy",
    status: 409,
  },
};

export async function createPosition(
  userId: string,
  req: BetRequest,
): Promise<BetResult> {
  const amount = Number(req.amount);
  if (!Number.isFinite(amount) || amount < XRPL_CONFIG.MIN_BET_USD) {
    throw new AppError("bad_amount", "Minimum bet is $1", 400);
  }
  if (amount > XRPL_CONFIG.MAX_BET_USD) {
    throw new AppError("bad_amount", "Maximum bet is $500", 400);
  }
  const roundedAmount = Math.round(amount * 100) / 100;

  const admin = getAdminSupabase();
  const { data, error } = await admin
    .rpc("place_bet", {
      p_user_id: userId,
      p_market_id: req.marketId,
      p_side: req.side,
      p_amount: roundedAmount,
    })
    .single();

  if (error) {
    // Map Postgres exception SQLSTATE codes to our AppError taxonomy.
    const sqlstate = (error as { code?: string }).code ?? "";
    const mapped = PG_ERROR_TO_APP[sqlstate];
    if (mapped) {
      throw new AppError(mapped.code, mapped.message, mapped.status);
    }
    throw new AppError("position_insert_failed", error.message, 500);
  }
  if (!data) {
    throw new AppError("position_insert_failed", "No row returned", 500);
  }
  const row = data as PlaceBetRow;
  return {
    positionId: row.position_id,
    newBalance: Number(row.new_balance),
  };
}
