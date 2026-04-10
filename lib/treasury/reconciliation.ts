import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  getRecentIncomingRlusd,
  type IncomingPayment,
} from "@/lib/treasury/xrpl";
import { matchDeposit } from "@/lib/treasury/deposit-matcher";
import type { DepositIntentRow } from "@/types/db";

export interface ReconcileResult {
  newEventsProcessed: number;
  depositsCredited: number;
  unmatched: IncomingPayment[];
  latestLedgerIndex: number;
}

export async function reconcileDeposits(): Promise<ReconcileResult> {
  const admin = getAdminSupabase();
  const { data: settings } = await admin
    .from("app_settings")
    .select("id, last_checked_ledger_index")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sinceLedger = Number(
    (settings as { last_checked_ledger_index?: number } | null)
      ?.last_checked_ledger_index ?? 0,
  );
  const settingsId = (settings as { id?: string } | null)?.id;

  const incoming = await getRecentIncomingRlusd(sinceLedger);

  const { data: pending } = await admin
    .from("deposit_intents")
    .select("*")
    .eq("status", "pending");
  const pendingIntents = (pending ?? []) as DepositIntentRow[];

  let credited = 0;
  const unmatched: IncomingPayment[] = [];
  let latestLedger = sinceLedger;

  for (const payment of incoming) {
    if (payment.ledgerIndex > latestLedger) latestLedger = payment.ledgerIndex;
    // Dedupe by xrpl_tx_hash.
    const { data: existing } = await admin
      .from("deposit_intents")
      .select("id")
      .eq("xrpl_tx_hash", payment.txHash)
      .maybeSingle();
    if (existing) continue;

    const match = matchDeposit(payment, pendingIntents);
    if (!match) {
      unmatched.push(payment);
      continue;
    }
    // Credit the user.
    const intent = match.intent;
    await admin
      .from("deposit_intents")
      .update({
        status: "confirmed",
        xrpl_tx_hash: payment.txHash,
        xrpl_ledger_index: payment.ledgerIndex,
        credited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", intent.id);

    // Insert ledger entry.
    const { data: balanceRow } = await admin
      .from("user_balance")
      .select("balance")
      .eq("user_id", intent.user_id)
      .maybeSingle();
    const prevBalance = Number(
      (balanceRow as { balance?: number } | null)?.balance ?? 0,
    );
    const newBalance = prevBalance + Number(intent.rlusd_amount);
    await admin.from("internal_wallet_ledger").insert({
      user_id: intent.user_id,
      entry_type: "deposit",
      amount: intent.rlusd_amount,
      reference_type: "deposit_intent",
      reference_id: intent.id,
      balance_after: newBalance,
    });
    credited++;
  }

  if (settingsId && latestLedger > sinceLedger) {
    await admin
      .from("app_settings")
      .update({
        last_checked_ledger_index: latestLedger,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settingsId);
  }

  return {
    newEventsProcessed: incoming.length,
    depositsCredited: credited,
    unmatched,
    latestLedgerIndex: latestLedger,
  };
}
