"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
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
}

export function SolDepositSheet({ open, onOpenChange }: SolDepositSheetProps) {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [solAmount, setSolAmount] = useState("0.1");
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
      .then((r) => r.json())
      .then((d: { solana?: { usd?: number } }) => {
        if (d.solana?.usd) setSolPrice(d.solana.usd);
      })
      .catch(() => undefined);
  }, [open]);

  const sol = Number(solAmount);
  const usdValue = solPrice && sol > 0 ? (sol * solPrice).toFixed(2) : "—";

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

      // Register the deposit intent on our server.
      await fetch("/api/sol/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle className="mb-1 font-sans text-xl font-bold text-accent-glow">
          Deposit SOL
        </SheetTitle>
        <SheetDescription className="mb-4 text-sm text-text-secondary">
          Send SOL from your wallet. Your balance updates in seconds.
        </SheetDescription>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-yes/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-8 w-8 text-yes">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-yes-glow">SOL sent!</p>
            <p className="text-sm text-text-muted text-center">
              Your balance will update within 30 seconds.
            </p>
            <Button onClick={() => { setStatus("idle"); onOpenChange(false); }}>
              Done
            </Button>
          </div>
        ) : (
          <>
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
                disabled={sending || !connected || sol <= 0}
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
