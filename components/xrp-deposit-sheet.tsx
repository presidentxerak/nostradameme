"use client";

import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useGetToken } from "@/app/providers";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
interface XrpDepositSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TREASURY_ADDRESS = process.env.NEXT_PUBLIC_XRPL_TREASURY_ADDRESS ?? "";

export function XrpDepositSheet({ open, onOpenChange }: XrpDepositSheetProps) {
  const getToken = useGetToken();
  const [xrpAmount, setXrpAmount] = useState("10");
  const [xrpAddress, setXrpAddress] = useState("");
  const [xrpPrice, setXrpPrice] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const treasuryAddress = TREASURY_ADDRESS;

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

  const handleCopyAddress = useCallback(async () => {
    if (!treasuryAddress) return;
    await navigator.clipboard.writeText(treasuryAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [treasuryAddress]);

  const handleConfirm = async () => {
    if (xrp <= 0 || !xrpAddress) {
      setError("Enter the XRP amount and your XRP address");
      return;
    }
    if (!xrpAddress.startsWith("r") || xrpAddress.length < 25) {
      setError("Enter a valid XRP address (starts with r)");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch("/api/xrp/deposit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ xrpAmount: xrp, xrpAddress }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        throw new Error(data.error?.message ?? "Failed to register deposit");
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
            <p className="text-lg font-bold text-yes-glow">Deposit registered!</p>
            <p className="max-w-xs text-center text-sm text-text-muted">
              Your balance will update automatically once the payment is confirmed on the network. This usually takes under 5 seconds.
            </p>
            <Button onClick={() => { setStatus("idle"); onOpenChange(false); }}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <SheetDescription className="mb-4 text-sm text-text-secondary">
              Send XRP to the address below, then confirm.
            </SheetDescription>

            {/* Treasury address + QR */}
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface/60 p-4">
              <p className="text-xs text-text-muted">Send XRP to:</p>
              {treasuryAddress && (
                <QRCodeSVG
                  value={treasuryAddress}
                  size={140}
                  bgColor="transparent"
                  fgColor="#9d5cf0"
                  level="M"
                />
              )}
              <p className="break-all text-center font-mono text-xs text-text-primary">
                {treasuryAddress || "Treasury address not configured"}
              </p>
              {treasuryAddress && (
                <button
                  onClick={handleCopyAddress}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-accent-glow transition-colors hover:bg-accent/10"
                >
                  {copied ? "Copied!" : "Copy address"}
                </button>
              )}
            </div>

            {/* Amount input */}
            <div className="mt-4 space-y-3">
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

              {/* Sender address */}
              <div>
                <label htmlFor="xrp-address" className="mb-1 block text-xs text-text-muted">
                  Your XRP address (starts with r)
                </label>
                <Input
                  id="xrp-address"
                  type="text"
                  placeholder="rYourXRPAddress..."
                  value={xrpAddress}
                  onChange={(e) => setXrpAddress(e.target.value.trim())}
                />
              </div>

              {error && <p className="text-center text-sm text-no-glow">{error}</p>}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={handleConfirm}
                disabled={sending || xrp <= 0 || !xrpAddress}
                size="lg"
              >
                {sending ? "Confirming..." : "I've sent the XRP"}
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
