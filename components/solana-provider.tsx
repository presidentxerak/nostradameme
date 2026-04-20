"use client";

import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { env } from "@/lib/config/env";

import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaProviderProps {
  children: React.ReactNode;
}

export function SolanaProvider({ children }: SolanaProviderProps) {
  const endpoint = env.NEXT_PUBLIC_SOLANA_RPC_URL;
  // Empty array = auto-detect wallets via Wallet Standard (Phantom, Solflare, Backpack, etc.)
  const wallets = useMemo(() => [], []);

  if (!endpoint || !env.NEXT_PUBLIC_SOLANA_TREASURY_ADDRESS) {
    return <>{children}</>;
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
