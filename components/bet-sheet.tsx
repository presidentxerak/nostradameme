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

interface BetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: MarketWithAsset | null;
  pools: MarketPools | null;
  side: "yes" | "no" | null;
  balance: number;
  onConfirm: (amount: number) => Promise<void>;
  onAddFunds: () => void;
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
    } catch (err) {
      setError(err instanceof Error ? err.message : COPY.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  const sideLabel = side === "yes" ? COPY.bet.yes : COPY.bet.no;
  const sideColor = side === "yes" ? "text-yes-glow" : "text-no-glow";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle className="sr-only">{COPY.bet.seal}</SheetTitle>
        <SheetDescription className="sr-only">{market.question}</SheetDescription>

        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-text-secondary">{COPY.bet.youSay}:</p>
          <p className={`font-sans text-xl font-bold ${sideColor}`}>{sideLabel}</p>
        </div>
        <p className="mb-4 text-xs text-text-muted">{market.question}</p>

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
            <Button variant="default" onClick={onAddFunds} size="lg">
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
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            {COPY.bet.cancel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
