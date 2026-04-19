import "server-only";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { verifyTransaction, getRecentSignatures } from "@/lib/solana/client";
import { getSpotPrice } from "@/lib/coingecko/service";
import { SOLANA_CONFIG } from "@/lib/solana/config";

export interface SolDepositResult {
  checked: number;
  credited: number;
  errors: string[];
}

export async function detectSolDeposits(): Promise<SolDepositResult> {
  const admin = getAdminSupabase();
  const result: SolDepositResult = { checked: 0, credited: 0, errors: [] };

  if (!SOLANA_CONFIG.treasuryAddress) return result;

  const { data: pendingRaw } = await admin
    .from("sol_deposit_intents")
    .select("*")
    .eq("status", "pending");
  const pending = (pendingRaw ?? []) as Array<{
    id: string;
    user_id: string;
    tx_signature: string;
    solana_address: string;
    expected_sol: number;
    sol_price_usd: number;
    usd_amount: number;
  }>;

  for (const intent of pending) {
    result.checked++;
    try {
      const minLamports = Math.floor(Number(intent.expected_sol) * LAMPORTS_PER_SOL * 0.98);
      const { confirmed, lamports } = await verifyTransaction(
        intent.tx_signature,
        intent.solana_address,
        SOLANA_CONFIG.treasuryAddress,
        minLamports,
      );
      if (!confirmed) continue;

      const solAmount = lamports / LAMPORTS_PER_SOL;
      const solPrice = await getSpotPrice("solana") ?? intent.sol_price_usd;
      const usdAmount = solAmount * solPrice;

      const { data: balRow } = await admin
        .from("user_balance")
        .select("balance")
        .eq("user_id", intent.user_id)
        .maybeSingle();
      const prevBalance = Number((balRow as { balance?: number } | null)?.balance ?? 0);

      await admin.from("internal_wallet_ledger").insert({
        user_id: intent.user_id,
        entry_type: "sol_deposit",
        amount: usdAmount,
        reference_type: "sol_deposit_intent",
        reference_id: intent.id,
        balance_after: prevBalance + usdAmount,
      });

      await admin
        .from("sol_deposit_intents")
        .update({
          status: "confirmed",
          usd_amount: usdAmount,
          sol_price_usd: solPrice,
          credited_at: new Date().toISOString(),
        })
        .eq("id", intent.id);

      result.credited++;
    } catch (err) {
      result.errors.push(
        `${intent.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return result;
}
