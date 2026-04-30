import "server-only";

import { Client, Wallet, convertStringToHex } from "xrpl";
import { env } from "@/lib/config/env";
import { XRPL_CONFIG } from "@/lib/config/xrpl";
import { AppError } from "@/lib/utils/errors";

export interface IncomingPayment {
  txHash: string;
  from: string;
  amount: number;
  currency: string;
  memo: string | null;
  ledgerIndex: number;
  timestamp: string;
}

export interface NetworkStatus {
  connected: boolean;
  ledgerIndex: number;
  treasuryAddress: string;
  reserveBaseXrp: number | null;
}

let clientPromise: Promise<Client> | null = null;
let treasuryWallet: Wallet | null = null;

async function getClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new Client(XRPL_CONFIG.WSS_URL, {
        connectionTimeout: 15000,
      });
      await client.connect();
      client.on("disconnected", () => {
        clientPromise = null;
      });
      return client;
    })();
  }
  return clientPromise;
}

function getTreasuryWallet(): Wallet {
  if (treasuryWallet) return treasuryWallet;
  try {
    treasuryWallet = Wallet.fromSeed(env.XRPL_TREASURY_SEED);
    return treasuryWallet;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad seed";
    throw new AppError("treasury_seed_invalid", msg, 500);
  }
}

export async function getTreasuryRlusdBalance(): Promise<number> {
  const client = await getClient();
  const wallet = getTreasuryWallet();
  const response = await client.request({
    command: "account_lines",
    account: wallet.classicAddress,
    ledger_index: "validated",
  });
  const lines = (response.result.lines ?? []) as Array<{
    currency: string;
    account: string;
    balance: string;
  }>;
  const line = lines.find(
    (l) =>
      (l.currency === "RLUSD" ||
        l.currency === XRPL_CONFIG.RLUSD_CURRENCY_HEX) &&
      l.account === XRPL_CONFIG.RLUSD_ISSUER,
  );
  if (!line) return 0;
  const n = Number(line.balance);
  return Number.isFinite(n) ? n : 0;
}

export async function sendRlusdPayout(
  to: string,
  amount: number,
  payoutId: string,
): Promise<string> {
  if (!env.FEATURE_ENABLE_PAYOUTS) {
    throw new AppError(
      "payouts_disabled",
      "Payouts feature is disabled",
      503,
    );
  }
  if (amount <= 0) {
    throw new AppError("bad_amount", "Amount must be positive", 400);
  }
  const client = await getClient();
  const wallet = getTreasuryWallet();

  const payment = {
    TransactionType: "Payment" as const,
    Account: wallet.classicAddress,
    Destination: to,
    Amount: {
      currency: XRPL_CONFIG.RLUSD_CURRENCY_HEX,
      issuer: XRPL_CONFIG.RLUSD_ISSUER,
      value: amount.toFixed(6),
    },
    Memos: [
      {
        Memo: {
          MemoType: convertStringToHex("nostradameme:payout"),
          MemoData: convertStringToHex(payoutId),
        },
      },
    ],
  };

  try {
    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    const meta = result.result.meta;
    const resultCode =
      typeof meta === "object" && meta !== null && "TransactionResult" in meta
        ? (meta as { TransactionResult: string }).TransactionResult
        : "tefUNKNOWN";
    if (resultCode !== "tesSUCCESS") {
      throw new AppError(
        "xrpl_tx_failed",
        `Payout failed: ${resultCode}`,
        502,
      );
    }
    return signed.hash;
  } catch (err) {
    if (err instanceof AppError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new AppError("xrpl_submit_error", msg, 502);
  }
}

export async function getRecentIncomingRlusd(
  sinceLedger: number,
): Promise<IncomingPayment[]> {
  const client = await getClient();
  const wallet = getTreasuryWallet();
  const response = await client.request({
    command: "account_tx",
    account: wallet.classicAddress,
    ledger_index_min: sinceLedger > 0 ? sinceLedger : -1,
    ledger_index_max: -1,
    limit: 100,
    forward: true,
  });
  const txs = (response.result.transactions ?? []) as Array<{
    tx?: Record<string, unknown>;
    tx_json?: Record<string, unknown>;
    meta?: Record<string, unknown> | string;
    hash?: string;
  }>;
  const results: IncomingPayment[] = [];
  for (const t of txs) {
    const tx = (t.tx ?? t.tx_json) as
      | (Record<string, unknown> & {
          TransactionType?: string;
          Account?: string;
          Destination?: string;
          Amount?: unknown;
          Memos?: Array<{ Memo?: { MemoData?: string } }>;
          ledger_index?: number;
          date?: number;
        })
      | undefined;
    if (!tx || tx.TransactionType !== "Payment") continue;
    if (tx.Destination !== wallet.classicAddress) continue;
    const meta = t.meta;
    if (typeof meta !== "object" || meta === null) continue;
    const result = (meta as { TransactionResult?: string }).TransactionResult;
    if (result !== "tesSUCCESS") continue;
    const delivered = (meta as { delivered_amount?: unknown }).delivered_amount;
    if (
      !delivered ||
      typeof delivered !== "object" ||
      !("currency" in delivered) ||
      !("value" in delivered) ||
      !("issuer" in delivered)
    )
      continue;
    const d = delivered as {
      currency: string;
      value: string;
      issuer: string;
    };
    if (d.issuer !== XRPL_CONFIG.RLUSD_ISSUER) continue;
    if (
      d.currency !== XRPL_CONFIG.RLUSD_CURRENCY_HEX &&
      d.currency !== "RLUSD"
    )
      continue;
    const amount = Number(d.value);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const memos = tx.Memos ?? [];
    let memo: string | null = null;
    if (memos.length > 0) {
      const hex = memos[0]?.Memo?.MemoData;
      if (hex) {
        try {
          memo = Buffer.from(hex, "hex").toString("utf8");
        } catch {
          memo = null;
        }
      }
    }
    const hash = (t.hash ??
      (tx as { hash?: string }).hash ??
      "") as string;
    const ledgerIndex = Number(tx.ledger_index ?? 0);
    const rippleEpoch = 946684800;
    const dateNumber = Number(tx.date ?? 0);
    const ts = new Date((rippleEpoch + dateNumber) * 1000).toISOString();
    results.push({
      txHash: hash,
      from: String(tx.Account ?? ""),
      amount,
      currency: "RLUSD",
      memo,
      ledgerIndex,
      timestamp: ts,
    });
  }
  return results;
}

export type TxConfirmation =
  | { status: "validated"; success: boolean; resultCode: string }
  | { status: "pending" }
  | { status: "not_found" };

export async function getTransactionStatus(
  txHash: string,
): Promise<TxConfirmation> {
  try {
    const client = await getClient();
    const response = await client.request({
      command: "tx",
      transaction: txHash,
    });
    const result = response.result as {
      validated?: boolean;
      meta?: { TransactionResult?: string } | string;
    };
    if (!result.validated) return { status: "pending" };
    const meta = result.meta;
    const code =
      typeof meta === "object" && meta !== null && "TransactionResult" in meta
        ? (meta as { TransactionResult: string }).TransactionResult
        : "tefUNKNOWN";
    return {
      status: "validated",
      success: code === "tesSUCCESS",
      resultCode: code,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("txnNotFound")) return { status: "not_found" };
    return { status: "pending" };
  }
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    const client = await getClient();
    const wallet = getTreasuryWallet();
    const info = await client.request({
      command: "server_info",
    });
    const state = (info.result.info ?? {}) as {
      validated_ledger?: { seq?: number; reserve_base_xrp?: number };
    };
    return {
      connected: true,
      ledgerIndex: Number(state.validated_ledger?.seq ?? 0),
      treasuryAddress: wallet.classicAddress,
      reserveBaseXrp: state.validated_ledger?.reserve_base_xrp ?? null,
    };
  } catch {
    return {
      connected: false,
      ledgerIndex: 0,
      treasuryAddress: env.XRPL_TREASURY_ADDRESS,
      reserveBaseXrp: null,
    };
  }
}
