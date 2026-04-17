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
          x: [0, -6, 10, -3, 0],
          transition: { duration: 0.5, ease: "easeInOut" },
        })
        .catch(() => undefined);
    }
  }, [pools.totalVolume, controls, reduce]);

  const orbPosition = `${Math.max(8, Math.min(92, yesPct))}%`;

  return (
    <div className="flex flex-col gap-2">
      <motion.div
        animate={controls}
        className="relative h-10 w-full overflow-hidden rounded-full border border-border bg-background/80"
      >
        {/* YES fill — vivid blue-green gradient */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{
            width: `${yesPct}%`,
            background: "linear-gradient(90deg, #00cc9e, #00d4ff)",
            opacity: 0.6,
          }}
        />
        {/* NO fill — vivid red-magenta gradient */}
        <div
          className="absolute inset-y-0 right-0 transition-all duration-700"
          style={{
            width: `${100 - yesPct}%`,
            background: "linear-gradient(90deg, #ff2222, #cc004e)",
            opacity: 0.6,
          }}
        />
        {/* Center line */}
        <div className="absolute inset-y-1 left-1/2 w-px -translate-x-1/2 bg-text-muted/20" />
        {/* Orb knot */}
        <motion.div
          animate={{ left: orbPosition }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-accent-glow/40 blur-md" />
            <div className="relative h-6 w-6 rounded-full border border-accent bg-surface shadow-lg shadow-accent/30" />
          </div>
        </motion.div>
      </motion.div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-yes-glow font-bold text-glow-yes">{COPY.bet.yes} {yesPct}%</span>
        <span className="text-text-muted text-xs">
          {formatUsdCompact(pools.totalVolume)}
        </span>
        <span className="text-no-glow font-bold text-glow-no">{100 - yesPct}% {COPY.bet.no}</span>
      </div>
    </div>
  );
}
