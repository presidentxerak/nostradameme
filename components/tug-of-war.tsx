"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion";
import { COPY } from "@/lib/config/copy";
import { formatUsdCompact } from "@/lib/utils/currency";
import type { MarketPools } from "@/types/app";

interface TugOfWarProps {
  pools: MarketPools;
}

export function TugOfWar({ pools }: TugOfWarProps) {
  const reduce = useReducedMotionPreference();
  const yesPct = pools.yesPct;
  const controls = useAnimationControls();
  const lastVolume = useRef(pools.totalVolume);

  useEffect(() => {
    const delta = pools.totalVolume - lastVolume.current;
    lastVolume.current = pools.totalVolume;
    if (delta > 50 && !reduce) {
      controls
        .start({
          x: [0, -8, 12, -4, 0],
          transition: { duration: 0.6, ease: "easeInOut" },
        })
        .catch(() => undefined);
    }
  }, [pools.totalVolume, controls, reduce]);

  const orbPosition = `${Math.max(5, Math.min(95, yesPct))}%`;

  return (
    <div className="my-4 flex flex-col gap-2">
      <motion.div
        animate={controls}
        className="relative h-14 w-full rounded-full border border-border bg-background/60"
      >
        {/* YES side fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-full bg-gradient-to-r from-yes/60 to-yes/20"
          style={{ width: `${yesPct}%` }}
        />
        {/* NO side fill */}
        <div
          className="absolute inset-y-0 right-0 rounded-r-full bg-gradient-to-l from-no/60 to-no/20"
          style={{ width: `${100 - yesPct}%` }}
        />
        {/* Center divider */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-text-muted/40" />
        {/* Orb knot */}
        <motion.div
          animate={{ left: orbPosition }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 18,
          }}
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-accent-glow/50 blur-md" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent bg-surface text-xl shadow-lg shadow-accent/40">
              {"\u{1f52e}"}
            </div>
          </div>
        </motion.div>
      </motion.div>
      <div className="flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 text-yes-glow">
          <span className="font-bold">{COPY.bet.yes}</span>
          <span>{yesPct}%</span>
        </div>
        <div className="text-text-secondary">
          {COPY.oracle.totalLabel}:{" "}
          <span className="font-mono text-text-primary">
            {formatUsdCompact(pools.totalVolume)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-no-glow">
          <span>{100 - yesPct}%</span>
          <span className="font-bold">{COPY.bet.no}</span>
        </div>
      </div>
    </div>
  );
}
