import "server-only";

import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { env } from "@/lib/config/env";
import { SOLANA_CONFIG } from "@/lib/solana/config";
import { AppError } from "@/lib/utils/errors";

let cachedConnection: Connection | null = null;

export function getConnection(): Connection {
  if (cachedConnection) return cachedConnection;
  cachedConnection = new Connection(SOLANA_CONFIG.rpcUrl, "confirmed");
  return cachedConnection;
}

function getTreasuryKeypair(): Keypair {
  if (!env.SOLANA_TREASURY_PRIVATE_KEY) {
    throw new AppError("sol_not_configured", "Solana treasury not configured", 503);
  }
  const decoded = bs58.decode(env.SOLANA_TREASURY_PRIVATE_KEY);
  return Keypair.fromSecretKey(decoded);
}

export async function getTreasuryBalance(): Promise<number> {
  const conn = getConnection();
  const pubkey = new PublicKey(SOLANA_CONFIG.treasuryAddress);
  const balance = await conn.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
}

export async function verifyTransaction(
  signature: string,
  expectedFrom: string,
  expectedTo: string,
  minLamports: number,
): Promise<{ confirmed: boolean; lamports: number }> {
  const conn = getConnection();
  const tx = await conn.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx || !tx.meta || tx.meta.err) {
    return { confirmed: false, lamports: 0 };
  }
  const accountKeys = tx.transaction.message.getAccountKeys();
  const from = accountKeys.get(0)?.toBase58();
  const to = accountKeys.get(1)?.toBase58();
  if (from !== expectedFrom || to !== expectedTo) {
    return { confirmed: false, lamports: 0 };
  }
  const preFrom = tx.meta.preBalances[0] ?? 0;
  const postFrom = tx.meta.postBalances[0] ?? 0;
  const transferred = preFrom - postFrom - (tx.meta.fee ?? 0);
  if (transferred < minLamports) {
    return { confirmed: false, lamports: 0 };
  }
  return { confirmed: true, lamports: transferred };
}

export async function sendSol(
  toAddress: string,
  lamports: number,
): Promise<string> {
  if (lamports <= 0) {
    throw new AppError("bad_amount", "Amount must be positive", 400);
  }
  const conn = getConnection();
  const treasury = getTreasuryKeypair();
  const balance = await conn.getBalance(treasury.publicKey);
  if (balance < lamports + 10000) {
    throw new AppError("treasury_low", "Treasury balance too low", 503);
  }
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: treasury.publicKey,
      toPubkey: new PublicKey(toAddress),
      lamports,
    }),
  );
  const signature = await sendAndConfirmTransaction(conn, tx, [treasury]);
  return signature;
}

export async function getRecentSignatures(
  limit = 50,
): Promise<Array<{ signature: string; slot: number; blockTime: number | null }>> {
  const conn = getConnection();
  const pubkey = new PublicKey(SOLANA_CONFIG.treasuryAddress);
  const sigs = await conn.getSignaturesForAddress(pubkey, { limit });
  return sigs.map((s) => ({
    signature: s.signature,
    slot: s.slot,
    blockTime: s.blockTime ?? null,
  }));
}
