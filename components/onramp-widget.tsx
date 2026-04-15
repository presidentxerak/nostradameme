"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COPY } from "@/lib/config/copy";
import { XRPL_CONFIG } from "@/lib/config/xrpl";

interface OnrampWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnrampWidget({ open, onOpenChange }: OnrampWidgetProps) {
  const [amount, setAmount] = useState<number>(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (amount < XRPL_CONFIG.MIN_DEPOSIT_USD) {
      setError(`Minimum $${XRPL_CONFIG.MIN_DEPOSIT_USD}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deposits/create-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsd: amount }),
      });
      const data = (await res.json()) as
        | { widgetUrl: string }
        | { error: { message: string } };
      if (!res.ok) {
        const msg =
          "error" in data ? data.error.message : COPY.errors.generic;
        throw new Error(msg);
      }
      if ("widgetUrl" in data) {
        window.location.href = data.widgetUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : COPY.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle className="mb-1 font-display text-2xl text-accent-glow">
          {COPY.depositSheet.title}
        </SheetTitle>
        <SheetDescription className="mb-5 text-sm text-text-secondary">
          {COPY.depositSheet.subtitle}
        </SheetDescription>
        <label htmlFor="deposit-amount" className="mb-2 block text-xs text-text-muted">
          {COPY.depositSheet.amountLabel}
        </label>
        <Input
          id="deposit-amount"
          type="text"
          inputMode="decimal"
          value={amount.toString()}
          onChange={(e) => {
            const n = Number(e.target.value.replace(/[^\d.]/g, ""));
            if (Number.isFinite(n)) setAmount(n);
          }}
        />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[25, 50, 100, 250].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className="rounded-xl border border-border bg-surface py-2 text-sm text-text-secondary hover:border-accent/40"
            >
              ${v}
            </button>
          ))}
        </div>
        {error && (
          <p className="mt-3 text-sm text-no-glow">{error}</p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="default"
            size="lg"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? COPY.depositSheet.processing : COPY.depositSheet.open}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {COPY.depositSheet.close}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
