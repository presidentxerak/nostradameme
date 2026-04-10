"use client";

import { useState } from "react";
import { COPY } from "@/lib/config/copy";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface AmountSelectorProps {
  value: number;
  onChange: (value: number) => void;
  maxBalance: number;
}

export function AmountSelector({
  value,
  onChange,
  maxBalance,
}: AmountSelectorProps) {
  const [custom, setCustom] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        {COPY.bet.quickAmounts.map((amt) => {
          const selected = !custom && value === amt;
          return (
            <button
              key={amt}
              type="button"
              onClick={() => {
                setCustom(false);
                onChange(amt);
              }}
              className={cn(
                "rounded-xl border py-2 text-center font-mono text-sm transition",
                selected
                  ? "border-accent bg-accent/20 text-accent-glow"
                  : "border-border bg-surface text-text-secondary hover:border-accent/50",
              )}
            >
              ${amt}
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
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={value > 0 ? value.toString() : ""}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/[^\d.]/g, "");
            const n = Number(cleaned);
            if (Number.isFinite(n)) {
              onChange(Math.min(n, maxBalance));
            }
          }}
        />
      )}
    </div>
  );
}
