import { env } from "@/lib/config/env";

export const SOLANA_CONFIG = {
  network: env.NEXT_PUBLIC_SOLANA_NETWORK,
  rpcUrl: env.NEXT_PUBLIC_SOLANA_RPC_URL,
  treasuryAddress: env.NEXT_PUBLIC_SOLANA_TREASURY_ADDRESS,
  minDepositSol: 0.01,
  minWithdrawUsd: 1,
} as const;
