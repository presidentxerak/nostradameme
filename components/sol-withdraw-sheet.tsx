"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useGetToken } from "@/app/providers";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/utils/currency";

interface SolWithdrawSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balance: number;
}

export function SolWithdrawSheet({ open, onOpenChange, balance }: SolWithdrawSheetProps) {
  const { publicKey, connected } = useWallet();
  const getToken = useGetToken();
  const [usdAmount, setUsdAmount] = useState("10");
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [txSig, setTxSig] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
      .then((r) => r.json())
      .then((d: { solana?: { usd?: number } }) => {
        if (d.solana?.usd) setSolPrice(d.solana.usd);
      })
      .catch(() => undefined);
  }, [open]);

  const usd = Number(usdAmount);
  const solValue = solPrice && usd > 0 ? (usd / solPrice).toFixed(4) : "—";

  const handleWithdraw = async () => {
    if (!publicKey || !connected) return;
    if (usd < 1) { setError("Minimum $1"); return; }
    if (usd > balance) { setError("Not enough balance"); return; }
    setSending(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/sol/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          usdAmount: usd,
          solanaAddress: publicKey.toBase58(),
        }),
      });
      const data = (await res.json()) as
        | { signature: string }
        | { error: { message: string } };
      if (!res.ok) {
        throw new Error("error" in data ? data.error.message : "Withdraw failed");
      }
      if ("signature" in data) setTxSig(data.signature);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdraw failed");
      setStatus("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle className="mb-1 font-sans text-xl font-bold text-accent-glow">
          Withdraw SOL
        </SheetTitle>
        <SheetDescription className="mb-4 text-sm text-text-secondary">
          Convert your balance to SOL and send to your wallet.
        </SheetDescription>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="h-16 w-16 rounded-full bg-yes/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-8 w-8 text-yes">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-yes-glow">SOL sent to your wallet!</p>
            {txSig && (
              <p className="text-xs text-text-muted break-all text-center">
                {txSig}
              </p>
            )}
            <Button onClick={() => { setStatus("idle"); onOpenChange(false); }}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-3">
              Balance: <span className="text-text-primary font-bold">{formatUsd(balance)}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="withdraw-usd" className="text-xs text-text-muted mb-1 block">
                  Amount ($)
                </label>
                <Input
                  id="withdraw-usd"
                  type="text"
                  inputMode="decimal"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setUsdAmount(v.toString())}
                    className="rounded-lg border border-border bg-surface py-2 text-xs text-text-secondary hover:border-accent/40"
                  >
                    ${v}
                  </button>
                ))}
              </div>

              {solPrice && (
                <p className="text-center text-sm text-text-secondary">
                  = <span className="font-bold text-text-primary">{solValue} SOL</span>
                  <span className="text-text-muted ml-1">(@ ${solPrice.toFixed(2)})</span>
                </p>
              )}

              <p className="text-center text-xs text-text-muted">
                To: {publicKey?.toBase58().slice(0, 8)}...{publicKey?.toBase58().slice(-4)}
              </p>

              {error && <p className="text-sm text-no-glow text-center">{error}</p>}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={handleWithdraw}
                disabled={sending || !connected || usd <= 0 || usd > balance}
                size="lg"
              >
                {sending ? "Withdrawing..." : `Withdraw ${formatUsd(usd)}`}
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
