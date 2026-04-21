"use client";

import { useEffect, useState } from "react";
import { formatRemaining } from "@/lib/utils/dates";
import { formatUsdCompact } from "@/lib/utils/currency";

interface CountdownGaugeProps {
  startAt: string;
  endAt: string;
  totalVolume?: number;
}

function formatTimeRange(startAt: string, endAt: string): string {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const fmtH = (d: Date) => {
    const h = d.getUTCHours();
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}${suffix}`;
  };
  return `${fmtH(s)} → ${fmtH(e)} UTC`;
}

export function CountdownGauge({ startAt, endAt, totalVolume }: CountdownGaugeProps) {
  const [remaining, setRemaining] = useState(() => formatRemaining(endAt));
  const [pct, setPct] = useState(100);

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const start = new Date(startAt).getTime();
      const end = new Date(endAt).getTime();
      const total = end - start;
      const left = end - now;
      setRemaining(left <= 0 ? "0s" : formatRemaining(endAt, now));
      setPct(total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startAt, endAt]);

  const timeRange = formatTimeRange(startAt, endAt);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 36 }}>
      <div
        className="absolute inset-0 bg-background/60"
        style={{
          clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
        }}
      />
      <div
        className="absolute inset-y-0 left-0 transition-all duration-1000"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, #ff8800, #ff6600)",
          clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
        <span>{timeRange} - {remaining} remaining</span>
        {typeof totalVolume === "number" && (
          <span className="text-gold-glow text-glow-gold">{formatUsdCompact(totalVolume)}</span>
        )}
      </div>
    </div>
  );
}
