"use client";

import { useEffect, useState } from "react";
import { formatRemaining } from "@/lib/utils/dates";
import { formatUsdCompact } from "@/lib/utils/currency";

interface BettingTimerProps {
  startAt: string;
  endAt: string;
  totalVolume?: number;
  onExpired?: () => void;
}

export function BettingTimer({ startAt, endAt, totalVolume, onExpired }: BettingTimerProps) {
  const [remaining, setRemaining] = useState(() => formatRemaining(endAt));
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const left = new Date(endAt).getTime() - Date.now();
      if (left <= 0) {
        setRemaining("0s");
        if (!expired) {
          setExpired(true);
          onExpired?.();
        }
      } else {
        setRemaining(formatRemaining(endAt));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endAt, expired, onExpired]);

  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-4 py-2.5">
      <div className="flex items-center gap-2">
        {expired ? (
          <>
            <span className="h-2.5 w-2.5 rounded-full bg-no" />
            <span className="text-xs font-bold uppercase tracking-wider text-no-glow">
              Betting closed
            </span>
          </>
        ) : (
          <>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-yes" />
            <span className="text-xs font-bold uppercase tracking-wider text-yes-glow">
              Betting open
            </span>
          </>
        )}
        <span className="font-mono text-lg font-bold text-text-primary">
          {remaining}
        </span>
      </div>
      {typeof totalVolume === "number" && (
        <span className="font-mono text-sm font-bold text-gold-glow text-glow-gold">
          {formatUsdCompact(totalVolume)}
        </span>
      )}
    </div>
  );
}
