"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AmountSelector } from "@/components/amount-selector";
import { PayoutPreview } from "@/components/payout-preview";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
import { XRPL_CONFIG } from "@/lib/config/xrpl";
import type { MarketPools, MarketWithAsset } from "@/types/app";

type PaymentMethod = "fiat" | "crypto" | null;

interface BetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: MarketWithAsset | null;
  pools: MarketPools | null;
  side: "yes" | "no" | null;
  balance: number;
  onConfirm: (amount: number) => Promise<void>;
  onAddFunds: (method: "fiat" | "crypto") => void;
}

export function BetSheet({
  open,
  onOpenChange,
  market,
  pools,
  side,
  balance,
  onConfirm,
  onAddFunds,
}: BetSheetProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [amount, setAmount] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!market || !side || !pools) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent />
      </Sheet>
    );
  }

  const tooLow = amount < XRPL_CONFIG.MIN_BET_USD;
  const tooHigh = amount > XRPL_CONFIG.MAX_BET_USD;
  const insufficient = amount > balance;

  const handleConfirm = async () => {
    if (tooLow || tooHigh || insufficient) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(amount);
      onOpenChange(false);
      setPaymentMethod(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : COPY.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPaymentMethod(null);
    onOpenChange(false);
  };

  const sideLabel = side === "yes" ? COPY.bet.yes : COPY.bet.no;
  const sideColor = side === "yes" ? "text-yes-glow" : "text-no-glow";

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent>
        <SheetTitle className="sr-only">{COPY.bet.seal}</SheetTitle>
        <SheetDescription className="sr-only">{market.question}</SheetDescription>

        {/* Header — always visible */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-text-secondary">{COPY.bet.youSay}:</p>
          <p className={`font-sans text-xl font-bold ${sideColor}`}>{sideLabel}</p>
        </div>
        <p className="mb-4 text-xs text-text-muted">{market.question}</p>

        {/* Step 1: Choose payment method */}
        {!paymentMethod ? (
          <div className="space-y-3">
            <p className="text-sm text-text-primary font-bold text-center mb-2">
              How do you want to bet?
            </p>

            <button
              onClick={() => setPaymentMethod("crypto")}
              className="w-full flex items-center gap-4 rounded-xl border border-accent/30 bg-surface/60 px-4 py-4 text-left transition-all hover:border-accent/60 hover:bg-surface"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-accent-glow">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12h8M12 8v8" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-text-primary">Pay with Solana</p>
                <p className="text-xs text-text-muted">Connect Phantom wallet</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-text-muted">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <button
              onClick={() => setPaymentMethod("fiat")}
              className="w-full flex items-center gap-4 rounded-xl border border-border/40 bg-surface/40 px-4 py-4 text-left transition-all hover:border-accent/40 hover:bg-surface/60"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-text-secondary">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-sans text-sm font-bold text-text-primary">Pay with card</p>
                <p className="text-xs text-text-muted">Powered by XRPL</p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-text-muted">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <Button variant="ghost" onClick={handleClose} className="w-full">
              {COPY.bet.cancel}
            </Button>
          </div>
        ) : (
          /* Step 2: Choose amount + confirm */
          <>
            <div className="mb-3 flex items-center gap-2">
              <button
                onClick={() => setPaymentMethod(null)}
                className="text-xs text-accent-glow hover:underline"
              >
                ← Change method
              </button>
              <span className="text-xs text-text-muted">
                {paymentMethod === "crypto" ? "Solana" : "Card (XRPL)"}
              </span>
            </div>

            <h3 className="mb-3 text-base text-text-primary">{COPY.bet.howMuch}</h3>

            <AmountSelector
              value={amount}
              onChange={setAmount}
              maxBalance={Math.min(balance, XRPL_CONFIG.MAX_BET_USD)}
            />

            <div className="mt-3 font-mono text-center text-3xl text-text-primary">
              {formatUsd(amount)}
            </div>

            <div className="mt-4">
              <PayoutPreview amount={amount} side={side} pools={pools} />
            </div>

            {error && <p className="mt-3 text-sm text-no-glow">{error}</p>}

            <div className="mt-5 flex flex-col gap-2">
              {insufficient ? (
                <Button variant="default" onClick={() => onAddFunds(paymentMethod ?? "crypto")} size="lg">
                  {COPY.header.addFunds}
                </Button>
              ) : (
                <Button
                  variant={side === "yes" ? "yes" : "no"}
                  onClick={handleConfirm}
                  disabled={submitting || tooLow || tooHigh}
                  size="lg"
                >
                  {submitting ? COPY.bet.sealing : COPY.bet.seal}
                </Button>
              )}
              <Button variant="ghost" onClick={handleClose} disabled={submitting}>
                {COPY.bet.cancel}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
