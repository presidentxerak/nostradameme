"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import type { Wallet } from "@solana/wallet-adapter-react";
import { useGetToken } from "@/app/providers";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SOLANA_CONFIG } from "@/lib/solana/config";

interface SolDepositSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const MOBILE_WALLET_LINKS: Record<string, { ios: string; android: string }> = {
  Phantom: {
    ios: "https://apps.apple.com/app/phantom-crypto-wallet/id1598432977",
    android: "https://play.google.com/store/apps/details?id=app.phantom",
  },
  Solflare: {
    ios: "https://apps.apple.com/app/solflare/id1580902717",
    android: "https://play.google.com/store/apps/details?id=com.solflare.mobile",
  },
};

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function isInWalletBrowser(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, Record<string, unknown> | undefined>;
  return !!(w.phantom?.solana || w.solflare?.isSolflare);
}

export function SolDepositSheet({ open, onOpenChange, onComplete }: SolDepositSheetProps) {
  const { publicKey, sendTransaction, connected, wallets, select, connect } = useWallet();
  const { connection } = useConnection();
  const getToken = useGetToken();
  const [solAmount, setSolAmount] = useState("0.1");
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const mobile = useMemo(() => isMobile(), []);
  const inWalletBrowser = useMemo(() => isInWalletBrowser(), []);

  useEffect(() => {
    if (!open) return;
    fetch("/api/prices?ids=solana")
      .then((r) => r.json())
      .then((d: { prices?: { solana?: number } }) => {
        if (d.prices?.solana) setSolPrice(d.prices.solana);
      })
      .catch(() => undefined);
  }, [open]);

  const sol = Number(solAmount);
  const usdValue = solPrice && sol > 0 ? (sol * solPrice).toFixed(2) : "—";

  const handleConnectWallet = async (wallet: Wallet) => {
    setConnecting(true);
    setError(null);
    try {
      if (mobile && !inWalletBrowser && wallet.readyState !== "Installed") {
        const name = wallet.adapter.name;
        const links = MOBILE_WALLET_LINKS[name];
        if (links) {
          const url = /iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? links.ios
            : links.android;
          window.open(url, "_blank");
          setError(`Open ${name} and visit this site from the wallet browser`);
          setConnecting(false);
          return;
        }
      }
      select(wallet.adapter.name);
      await new Promise((r) => setTimeout(r, 300));
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleSend = async () => {
    if (!publicKey || !connected || !SOLANA_CONFIG.treasuryAddress) return;
    if (sol < SOLANA_CONFIG.minDepositSol) {
      setError(`Minimum ${SOLANA_CONFIG.minDepositSol} SOL`);
      return;
    }
    setSending(true);
    setError(null);
    try {
      const lamports = Math.round(sol * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(SOLANA_CONFIG.treasuryAddress),
          lamports,
        }),
      );
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      const token = await getToken();
      await fetch("/api/sol/deposit", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          txSignature: signature,
          solAmount: sol,
          solAddress: publicKey.toBase58(),
        }),
      });
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  const availableWallets = wallets.filter(
    (w) =>
      w.readyState === "Installed" ||
      w.readyState === "Loadable" ||
      (mobile && MOBILE_WALLET_LINKS[w.adapter.name]),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle className="mb-1 font-sans text-xl font-bold text-accent-glow">
          Deposit SOL
        </SheetTitle>

        {!connected ? (
          <>
            {mobile && !inWalletBrowser ? (
              <div className="my-4 rounded-xl border-2 border-no-glow bg-no/10 px-4 py-5 text-center">
                <p className="font-sans text-base font-bold leading-relaxed text-white">
                  TO ADD FUNDS: TAP YOUR WALLET TO OPEN IT, THEN OPEN THE APP WITH THE WALLET EXPLORER AND TAP IN THE URL FIELD:
                </p>
                <p className="mt-3 font-mono text-lg font-bold text-no-glow">
                  nostradameme.com
                </p>
              </div>
            ) : (
              <SheetDescription className="mb-4 text-sm text-text-secondary">
                Select your wallet to continue
              </SheetDescription>
            )}

            <div className="flex flex-col gap-2">
              {availableWallets.length > 0 ? (
                availableWallets.map((wallet) => {
                  const installed = wallet.readyState === "Installed";
                  return (
                    <button
                      key={wallet.adapter.name}
                      onClick={() => handleConnectWallet(wallet)}
                      disabled={connecting}
                      className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-left transition-all hover:border-accent/50 hover:bg-surface disabled:opacity-50"
                    >
                      {wallet.adapter.icon && (
                        <img
                          src={wallet.adapter.icon}
                          alt={wallet.adapter.name}
                          className="h-8 w-8 rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-sans text-sm font-bold text-text-primary">
                          {wallet.adapter.name}
                        </p>
                        <p className="text-xs text-text-muted">
                          {installed
                            ? "Detected"
                            : mobile
                              ? "Tap to open"
                              : "Available"}
                        </p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-text-muted">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-border bg-surface/60 p-6 text-center">
                  <p className="text-sm text-text-secondary mb-3">
                    No wallet detected
                  </p>
                  <a
                    href="https://phantom.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent-glow underline"
                  >
                    Install Phantom
                  </a>
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-no-glow text-center">{error}</p>}

            <Button variant="ghost" className="mt-4 w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </>
        ) : status === "sent" ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-yes/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-8 w-8 text-yes">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-yes-glow">SOL sent!</p>
            <p className="text-sm text-text-muted text-center">
              Your balance is ready. You can bet now!
            </p>
            {onComplete ? (
              <Button onClick={() => { setStatus("idle"); onOpenChange(false); onComplete(); }} size="lg">
                Launch Prediction
              </Button>
            ) : (
              <Button onClick={() => { setStatus("idle"); onOpenChange(false); }}>
                Done
              </Button>
            )}
          </div>
        ) : (
          <>
            <SheetDescription className="mb-4 text-sm text-text-secondary">
              Send SOL from your wallet. Your balance updates in seconds.
            </SheetDescription>

            <p className="mb-3 text-xs text-text-muted">
              Wallet: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="sol-amount" className="text-xs text-text-muted mb-1 block">
                  Amount (SOL)
                </label>
                <Input
                  id="sol-amount"
                  type="text"
                  inputMode="decimal"
                  value={solAmount}
                  onChange={(e) => setSolAmount(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[0.05, 0.1, 0.5, 1].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSolAmount(v.toString())}
                    className="rounded-lg border border-border bg-surface py-2 text-xs text-text-secondary hover:border-accent/40"
                  >
                    {v} SOL
                  </button>
                ))}
              </div>

              {solPrice && (
                <p className="text-center text-sm text-text-secondary">
                  = <span className="font-bold text-text-primary">${usdValue}</span>
                  <span className="text-text-muted ml-1">(SOL @ ${solPrice.toFixed(2)})</span>
                </p>
              )}

              {error && <p className="text-sm text-no-glow text-center">{error}</p>}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={handleSend}
                disabled={sending || sol <= 0}
                size="lg"
              >
                {sending ? "Sending..." : `Send ${solAmount} SOL`}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
