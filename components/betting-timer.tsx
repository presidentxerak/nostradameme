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
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 shrink-0 text-no-glow">
              {/* Frame */}
              <rect x="5" y="1" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="5" y="21" width="14" height="2" rx="1" fill="currentColor" />
              {/* Glass body */}
              <path d="M7 3v3.5c0 1 .5 2 1.5 3L12 12l-3.5 2.5c-1 1-1.5 2-1.5 3V21h10v-3.5c0-1-.5-2-1.5-3L12 12l3.5-2.5c1-1 1.5-2 1.5-3V3H7z" stroke="currentColor" strokeWidth="1.5" />
              {/* All sand at bottom */}
              <path d="M8 18c0-1 .8-2 2-2.8L12 14l2 1.2c1.2.8 2 1.8 2 2.8v3H8v-3z" fill="currentColor" opacity="0.4" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-no-glow">
              Betting closed
            </span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 shrink-0 text-yes-glow">
              {/* Frame */}
              <rect x="5" y="1" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="5" y="21" width="14" height="2" rx="1" fill="currentColor" />
              {/* Glass body */}
              <path d="M7 3v3.5c0 1 .5 2 1.5 3L12 12l-3.5 2.5c-1 1-1.5 2-1.5 3V21h10v-3.5c0-1-.5-2-1.5-3L12 12l3.5-2.5c1-1 1.5-2 1.5-3V3H7z" stroke="currentColor" strokeWidth="1.5" />
              {/* Sand top (shrinking) */}
              <path d="M8 3h8v2c0 .5-.3 1-.8 1.5L12 9l-3.2-2.5C8.3 6 8 5.5 8 5V3z" fill="currentColor" opacity="0.5" />
              {/* Sand stream (falling) */}
              <line x1="12" y1="10" x2="12" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.6">
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
              </line>
              {/* Sand bottom (growing) */}
              <path d="M9.5 19.5c0-.5.5-1 1.2-1.5l1.3-1 1.3 1c.7.5 1.2 1 1.2 1.5V21h-5v-1.5z" fill="currentColor" opacity="0.4" />
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
