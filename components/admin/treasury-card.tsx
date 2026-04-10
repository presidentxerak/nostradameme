"use client";

import { Card } from "@/components/ui/card";
import { formatUsd } from "@/lib/utils/currency";

interface TreasuryCardProps {
  balance: number;
  address: string;
  connected: boolean;
  ledgerIndex: number;
}

export function TreasuryCard({
  balance,
  address,
  connected,
  ledgerIndex,
}: TreasuryCardProps) {
  return (
    <Card className="border-gold/40">
      <h3 className="mb-2 font-display text-sm uppercase tracking-widest text-gold-glow">
        Treasury
      </h3>
      <p className="text-xs text-text-muted">Available pool</p>
      <p className="font-mono text-3xl text-gold-glow">{formatUsd(balance)}</p>
      <div className="mt-3 flex flex-col gap-1 text-xs">
        <span className="text-text-muted">Account</span>
        <span className="truncate font-mono text-text-primary">{address}</span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <span
          className={
            connected ? "text-yes-glow" : "text-no-glow"
          }
        >
          {connected ? "\u25cf online" : "\u25cf offline"}
        </span>
        <span className="font-mono text-text-muted">L#{ledgerIndex}</span>
      </div>
    </Card>
  );
}
