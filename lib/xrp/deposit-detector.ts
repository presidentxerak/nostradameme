import "server-only";

import { Client } from "xrpl";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getSpotPrice } from "@/lib/coingecko/service";
import { env } from "@/lib/config/env";
import { XRPL_CONFIG } from "@/lib/config/xrpl";

export interface XrpDepositResult {
  checked: number;
  credited: number;
  errors: string[];
}

interface XrpDepositIntent {
  id: string;
  user_id: string;
  xrp_address: string;
  expected_xrp: number;
  xrp_price_usd: number;
  usd_amount: number;
  created_at: string;
}

interface XrplTx {
  tx?: Record<string, unknown>;
  tx_json?: Record<string, unknown>;
  meta?: Record<string, unknown> | string;
  hash?: string;
}

export async function detectXrpDeposits(): Promise<XrpDepositResult> {
  const admin = getAdminSupabase();
  const result: XrpDepositResult = { checked: 0, credited: 0, errors: [] };

  const treasuryAddress = env.XRPL_TREASURY_ADDRESS;
  if (!treasuryAddress) return result;

  const { data: pendingRaw } = await admin
    .from("xrp_deposit_intents")
    .select("*")
    .eq("status", "pending");
  const pending = (pendingRaw ?? []) as XrpDepositIntent[];
  if (pending.length === 0) return result;

  const client = new Client(XRPL_CONFIG.WSS_URL, { connectionTimeout: 15000 });
  try {
    await client.connect();

    const first = pending[0]!;
    const oldestIntent = pending.reduce(
      (min, p) => (p.created_at < min ? p.created_at : min),
      first.created_at,
    );
    const lookbackMs = Date.now() - new Date(oldestIntent).getTime();
    const lookbackLedgers = Math.max(Math.ceil(lookbackMs / 4000), 1000);

    const serverInfo = await client.request({ command: "server_info" });
    const currentLedger = Number(
      (serverInfo.result.info as { validated_ledger?: { seq?: number } })
        .validated_ledger?.seq ?? 0,
    );
    const sinceLedger = Math.max(currentLedger - lookbackLedgers, 1);

    const response = await client.request({
      command: "account_tx",
      account: treasuryAddress,
      ledger_index_min: sinceLedger,
      ledger_index_max: -1,
      limit: 200,
      forward: false,
    });

    const txs = (response.result.transactions ?? []) as XrplTx[];

    const incomingXrp: Array<{
      hash: string;
      from: string;
      drops: number;
      ledgerIndex: number;
      timestamp: string;
    }> = [];

    for (const t of txs) {
      const tx = (t.tx ?? t.tx_json) as
        | (Record<string, unknown> & {
            TransactionType?: string;
            Account?: string;
            Destination?: string;
            Amount?: unknown;
            ledger_index?: number;
            date?: number;
          })
        | undefined;
      if (!tx || tx.TransactionType !== "Payment") continue;
      if (tx.Destination !== treasuryAddress) continue;

      const meta = t.meta;
      if (typeof meta !== "object" || meta === null) continue;
      const txResult = (meta as { TransactionResult?: string }).TransactionResult;
      if (txResult !== "tesSUCCESS") continue;

      const delivered = (meta as { delivered_amount?: unknown }).delivered_amount;
      if (typeof delivered !== "string") continue;
      const drops = Number(delivered);
      if (!Number.isFinite(drops) || drops <= 0) continue;

      const hash = (t.hash ?? (tx as { hash?: string }).hash ?? "") as string;
      const ledgerIndex = Number(tx.ledger_index ?? 0);
      const rippleEpoch = 946684800;
      const dateNumber = Number(tx.date ?? 0);
      const ts = new Date((rippleEpoch + dateNumber) * 1000).toISOString();

      incomingXrp.push({
        hash,
        from: String(tx.Account ?? ""),
        drops,
        ledgerIndex,
        timestamp: ts,
      });
    }

    for (const intent of pending) {
      result.checked++;
      try {
        const expectedDrops = Math.round(intent.expected_xrp * 1_000_000);
        const tolerance = 0.02;

        const match = incomingXrp.find(
          (tx) =>
            tx.from === intent.xrp_address &&
            tx.drops >= expectedDrops * (1 - tolerance),
        );

        if (!match) continue;

        const xrpAmount = match.drops / 1_000_000;
        const xrpPrice = (await getSpotPrice("ripple")) ?? intent.xrp_price_usd;
        const usdAmount = xrpAmount * xrpPrice;

        const { data: balRow } = await admin
          .from("user_balance")
          .select("balance")
          .eq("user_id", intent.user_id)
          .maybeSingle();
        const prevBalance = Number(
          (balRow as { balance?: number } | null)?.balance ?? 0,
        );

        await admin.from("internal_wallet_ledger").insert({
          user_id: intent.user_id,
          entry_type: "xrp_deposit",
          amount: usdAmount,
          reference_type: "xrp_deposit_intent",
          reference_id: intent.id,
          balance_after: prevBalance + usdAmount,
        });

        await admin
          .from("xrp_deposit_intents")
          .update({
            status: "confirmed",
            usd_amount: usdAmount,
            xrp_price_usd: xrpPrice,
            tx_hash: match.hash,
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
  } finally {
    await client.disconnect().catch(() => undefined);
  }

  return result;
}
