"use client";

import { useState, useEffect } from "react";
import { useXrplWallet } from "@/components/xrpl-wallet-provider";
import { useGetToken } from "@/app/providers";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface XrpDepositSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_XRPL_TREASURY_ADDRESS ?? "";

export function XrpDepositSheet({ open, onOpenChange, onComplete }: XrpDepositSheetProps) {
  const { manager, connected, address, walletName } = useXrplWallet();
  const getToken = useGetToken();
  const [xrpAmount, setXrpAmount] = useState("10");
  const [xrpPrice, setXrpPrice] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setError(null);
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd")
      .then((r) => r.json())
      .then((d: { ripple?: { usd?: number } }) => {
        if (d.ripple?.usd) setXrpPrice(d.ripple.usd);
      })
      .catch(() => undefined);
  }, [open]);

  const xrp = Number(xrpAmount);
  const usdValue = xrpPrice && xrp > 0 ? (xrp * xrpPrice).toFixed(2) : "—";

  const handleConnect = async () => {
    if (!manager) return;
    setConnecting(true);
    setError(null);
    try {
      const connectorEl = document.querySelector("xrpl-wallet-connector");
      if (connectorEl && "open" in connectorEl) {
        (connectorEl as HTMLElement & { setWalletManager: (m: unknown) => void; open: () => void }).setWalletManager(manager);
        (connectorEl as HTMLElement & { open: () => void }).open();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  const handleSend = async () => {
    if (!manager || !connected || !address || !TREASURY_ADDRESS) return;
    if (xrp <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const drops = String(Math.round(xrp * 1_000_000));
      const result = await manager.signAndSubmit({
        TransactionType: "Payment",
        Account: address,
        Destination: TREASURY_ADDRESS,
        Amount: drops,
      });

      const token = await getToken();
      await fetch("/api/xrp/deposit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ xrpAmount: xrp, xrpAddress: address }),
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
          Deposit XRP
        </SheetTitle>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yes/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-8 w-8 text-yes">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-bold text-yes-glow">XRP sent!</p>
            <p className="max-w-xs text-center text-sm text-text-muted">
              Your balance will update once confirmed on-chain (usually under 1 minute).
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
        ) : !connected ? (
          <>
            <SheetDescription className="mb-4 text-sm text-text-secondary">
              Connect your XRP wallet to deposit
            </SheetDescription>

            <div className="flex flex-col gap-3">
              {manager?.adapters.map((adapter) => (
                <button
                  key={adapter.id}
                  onClick={async () => {
                    setConnecting(true);
                    setError(null);
                    try {
                      await manager.connect(adapter.id);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Connection failed");
                    } finally {
                      setConnecting(false);
                    }
                  }}
                  disabled={connecting}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 px-4 py-3 text-left transition-all hover:border-accent/50 hover:bg-surface disabled:opacity-50"
                >
                  {adapter.icon && (
                    <img src={adapter.icon} alt={adapter.name} className="h-8 w-8 rounded-lg" />
                  )}
                  <div className="flex-1">
                    <p className="font-sans text-sm font-bold text-text-primary">{adapter.name}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-text-muted">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )) ?? (
                <p className="text-center text-sm text-text-muted">Loading wallets...</p>
              )}
            </div>

            {error && <p className="mt-3 text-center text-sm text-no-glow">{error}</p>}

            <Button variant="ghost" className="mt-4 w-full" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <SheetDescription className="mb-4 text-sm text-text-secondary">
              Send XRP from your wallet. Your balance updates in under a minute.
            </SheetDescription>

            <div className="mb-3 flex items-center gap-2 rounded-lg bg-surface/60 px-3 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-yes" />
              <span className="text-xs text-text-primary">{walletName} connected</span>
            </div>
            <p className="mb-3 break-all font-mono text-xs text-text-muted">
              {address}
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="xrp-amount" className="mb-1 block text-xs text-text-muted">
                  Amount (XRP)
                </label>
                <Input
                  id="xrp-amount"
                  type="text"
                  inputMode="decimal"
                  value={xrpAmount}
                  onChange={(e) => setXrpAmount(e.target.value.replace(/[^\d.]/g, ""))}
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 50, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setXrpAmount(v.toString())}
                    className="rounded-lg border border-border bg-surface py-2 text-xs text-text-secondary hover:border-accent/40"
                  >
                    {v} XRP
                  </button>
                ))}
              </div>

              {xrpPrice && (
                <p className="text-center text-sm text-text-secondary">
                  = <span className="font-bold text-text-primary">${usdValue}</span>
                  <span className="ml-1 text-text-muted">(XRP @ ${xrpPrice.toFixed(4)})</span>
                </p>
              )}

              {error && <p className="text-center text-sm text-no-glow">{error}</p>}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={handleSend}
                disabled={sending || xrp <= 0}
                size="lg"
              >
                {sending ? "Sending..." : `Send ${xrpAmount} XRP`}
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
