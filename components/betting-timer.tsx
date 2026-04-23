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
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-no-glow">
              <path d="M6 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M6 2h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 22h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-no-glow">
              Betting closed
            </span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 animate-pulse text-yes-glow">
              <path d="M6 2h12v4l-4 4 4 4v4H6v-4l4-4-4-4V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M6 2h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 22h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 16h4l-2-2-2 2z" fill="currentColor" opacity="0.6" />
            </svg>
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
