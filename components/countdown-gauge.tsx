"use client";

import { useEffect, useState } from "react";
import { formatRemaining, msUntil } from "@/lib/utils/dates";
import { COPY } from "@/lib/config/copy";
import type { MarketSlot } from "@/types/db";

interface CountdownGaugeProps {
  startAt: string;
  endAt: string;
  slot: MarketSlot;
  locked: boolean;
}

const SLOT_LABEL: Record<MarketSlot, string> = {
  morning: "Dawn 9h \u2192 12h",
  noon: "Noon 12h \u2192 00h",
  night: "Dusk 00h \u2192 9h",
  weekly: "Weekly",
};

export function CountdownGauge({ startAt, endAt, slot, locked }: CountdownGaugeProps) {
  const [remaining, setRemaining] = useState(() => formatRemaining(endAt));
  const [pct, setPct] = useState(100);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const start = new Date(startAt).getTime();
      const end = new Date(endAt).getTime();
      const total = end - start;
      const left = end - now;
      setRemaining(formatRemaining(endAt, now));
      setPct(total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startAt, endAt]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 26 }}>
      {/* Background track */}
      <div
        className="absolute inset-0 bg-background/60"
        style={{
          clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
        }}
      />
      {/* Orange fill — arrow shape */}
      <div
        className="absolute inset-y-0 left-0 transition-all duration-1000"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, #ff8800, #ff6600)",
          clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
        }}
      />
      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
        {locked ? (
          <span>{COPY.oracle.locked}</span>
        ) : (
          <>
            <span>{SLOT_LABEL[slot]}</span>
            <span>-</span>
            <span>{remaining} remaining</span>
          </>
        )}
      </div>
    </div>
  );
}
