"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PayoutPreview } from "@/components/payout-preview";
import { Input } from "@/components/ui/input";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { XRPL_CONFIG } from "@/lib/config/xrpl";
import type { MarketPools, MarketWithAsset } from "@/types/app";

type PayMethod = "sol" | "xrp";

interface BetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: MarketWithAsset | null;
  pools: MarketPools | null;
  side: "yes" | "no" | null;
  balance: number;
  onConfirm: (amount: number) => Promise<void>;
  onAddFunds: (method: "sol" | "xrp") => void;
}

const SOL_PRESETS = [0.03, 0.07, 0.15, 0.35];
const XRP_PRESETS = [5, 10, 25, 50];

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
  const [method, setMethod] = useState<PayMethod>("sol");
  const [cryptoAmount, setCryptoAmount] = useState<string>("0.07");
  const [custom, setCustom] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [xrpPrice, setXrpPrice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    fetch("/api/prices?ids=solana,ripple")
      .then((r) => r.json())
      .then((d: { prices?: { solana?: number; ripple?: number } }) => {
        if (d.prices?.solana) setSolPrice(d.prices.solana);
        if (d.prices?.ripple) setXrpPrice(d.prices.ripple);
      })
      .catch(() => undefined);
  }, [open]);

  useEffect(() => {
    setCustom(false);
    setCryptoAmount(method === "sol" ? "0.07" : "10");
  }, [method]);

  if (!market || !side || !pools) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent />
      </Sheet>
    );
  }

  const price = method === "sol" ? solPrice : xrpPrice;
  const crypto = Number(cryptoAmount) || 0;
  const usdAmount = price ? crypto * price : 0;
  const presets = method === "sol" ? SOL_PRESETS : XRP_PRESETS;
  const symbol = method === "sol" ? "SOL" : "XRP";

  const tooLow = usdAmount > 0 && usdAmount < XRPL_CONFIG.MIN_BET_USD;
  const tooHigh = usdAmount > XRPL_CONFIG.MAX_BET_USD;
  const insufficient = usdAmount > balance;

  const handleConfirm = async () => {
    if (tooLow || tooHigh || insufficient || usdAmount <= 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(usdAmount);
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

        {/* Payment method toggle */}
        <div className="mb-4 flex gap-1 rounded-xl border border-border/40 bg-surface/40 p-1">
          {(["sol", "xrp"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                "flex-1 rounded-lg py-2 text-xs font-bold tracking-wider transition-all",
                method === m
                  ? "bg-accent text-white shadow-md shadow-accent/20"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              {m === "sol" ? "SOL" : "XRP"}
            </button>
          ))}
        </div>

        <h3 className="mb-3 text-base text-text-primary">{COPY.bet.howMuch}</h3>

        {/* Crypto amount presets */}
        <div className="grid grid-cols-5 gap-2">
          {presets.map((amt) => {
            const selected = !custom && cryptoAmount === amt.toString();
            return (
              <button
                key={amt}
                type="button"
                onClick={() => { setCustom(false); setCryptoAmount(amt.toString()); }}
                className={cn(
                  "rounded-xl border py-2 text-center font-mono text-sm transition",
                  selected
                    ? "border-accent bg-accent/20 text-accent-glow"
                    : "border-border bg-surface text-text-secondary hover:border-accent/50",
                )}
              >
                {amt}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCustom(true)}
            className={cn(
              "rounded-xl border py-2 text-center text-xs transition",
              custom
                ? "border-accent bg-accent/20 text-accent-glow"
                : "border-border bg-surface text-text-secondary hover:border-accent/50",
            )}
          >
            {COPY.bet.customLabel}
          </button>
        </div>

        {custom && (
          <Input
            className="mt-3"
            type="text"
            inputMode="decimal"
            placeholder={`0.00 ${symbol}`}
            value={cryptoAmount}
            onChange={(e) => setCryptoAmount(e.target.value.replace(/[^\d.]/g, ""))}
          />
        )}

        {/* Big crypto amount + USD equivalent */}
        <div className="mt-3 text-center">
          <p className="font-mono text-3xl text-text-primary">
            {cryptoAmount} {symbol}
          </p>
          {price ? (
            <p className="mt-1 text-sm text-text-muted">
              = {formatUsd(usdAmount)} <span className="text-text-muted">({symbol} @ ${price.toFixed(method === "sol" ? 2 : 4)})</span>
            </p>
          ) : (
            <p className="mt-1 text-sm text-text-muted">Loading price...</p>
          )}
        </div>

        <div className="mt-4">
          <PayoutPreview amount={usdAmount} side={side} pools={pools} />
        </div>

        {tooLow && <p className="mt-2 text-center text-xs text-no-glow">{COPY.bet.minAmountError}</p>}
        {tooHigh && <p className="mt-2 text-center text-xs text-no-glow">{COPY.bet.maxAmountError}</p>}
        {error && <p className="mt-3 text-sm text-no-glow">{error}</p>}

        <div className="mt-5 flex flex-col gap-2">
          {insufficient ? (
            <Button variant="default" onClick={() => onAddFunds(method)} size="lg">
              {COPY.header.addFunds}
            </Button>
          ) : (
            <Button
              variant={side === "yes" ? "yes" : "no"}
              onClick={handleConfirm}
              disabled={submitting || tooLow || tooHigh || usdAmount <= 0}
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
