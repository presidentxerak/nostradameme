"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/utils/currency";
import type { MarketRow } from "@/types/db";

interface MarketTableProps {
  markets: Array<
    MarketRow & { asset_key?: string; total_volume?: number | null }
  >;
}

export function MarketTable({ markets }: MarketTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-[80px_1fr_100px_120px_80px] gap-2 border-b border-border bg-background/40 px-3 py-2 text-[10px] uppercase tracking-widest text-text-muted">
        <span>Slot</span>
        <span>Question</span>
        <span>Status</span>
        <span>Volume</span>
        <span>End</span>
      </div>
      <div className="divide-y divide-border">
        {markets.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[80px_1fr_100px_120px_80px] gap-2 px-3 py-3 text-sm"
          >
            <span className="font-mono text-xs text-text-secondary">
              {m.slot}
            </span>
            <span className="truncate text-text-primary">{m.question}</span>
            <Badge
              variant={
                m.status === "open"
                  ? "yes"
                  : m.status === "resolved"
                    ? "default"
                    : m.status === "canceled"
                      ? "no"
                      : "muted"
              }
            >
              {m.status}
            </Badge>
            <span className="font-mono text-gold-glow">
              {formatUsd(Number(m.total_volume ?? 0))}
            </span>
            <span className="text-xs text-text-muted">
              {new Date(m.end_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
