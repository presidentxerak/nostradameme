"use client";

import { COPY } from "@/lib/config/copy";
import { formatUsd, calculatePayoutEstimate } from "@/lib/utils/currency";
import { XRPL_CONFIG } from "@/lib/config/xrpl";
import type { MarketPools } from "@/types/app";

interface PayoutPreviewProps {
  amount: number;
  side: "yes" | "no";
  pools: MarketPools;
}

export function PayoutPreview({ amount, side, pools }: PayoutPreviewProps) {
  const sidePool = side === "yes" ? pools.yesPool : pools.noPool;
  const oppositePool = side === "yes" ? pools.noPool : pools.yesPool;
  const estimated = calculatePayoutEstimate(
    amount,
    sidePool,
    oppositePool,
    XRPL_CONFIG.PLATFORM_FEE_BPS,
  );
  const returnPct =
    amount > 0 && estimated > amount
      ? Math.round(((estimated - amount) / amount) * 100)
      : 0;
  const label = side === "yes" ? COPY.bet.ifYesWins : COPY.bet.ifNoWins;

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-background/60 p-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary">{label}</span>
        <span className="font-mono text-gold-glow">
          ~{formatUsd(estimated)}
          {returnPct > 0 && (
            <span className="ml-1 text-gold">(+{returnPct}%)</span>
          )}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{COPY.bet.poolLabel}</span>
        <span className="font-mono text-text-muted">
          {COPY.bet.yes} {pools.yesPct}% / {COPY.bet.no} {pools.noPct}%
        </span>
      </div>
    </div>
  );
}
