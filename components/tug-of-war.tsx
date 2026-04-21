"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion";
import { COPY } from "@/lib/config/copy";
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
          x: [0, -4, 6, -2, 0],
          transition: { duration: 0.4, ease: "easeInOut" },
        })
        .catch(() => undefined);
    }
  }, [pools.totalVolume, controls, reduce]);

  return (
    <div className="flex flex-col gap-1">
      <motion.div
        animate={controls}
        className="relative w-full overflow-hidden rounded-full"
        style={{ height: 36 }}
      >
        {/* YES fill */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{
            width: `${yesPct}%`,
            background: "linear-gradient(90deg, #00cc9e, #00d4ff)",
          }}
        />
        {/* NO fill */}
        <div
          className="absolute inset-y-0 right-0 transition-all duration-700"
          style={{
            width: `${100 - yesPct}%`,
            background: "linear-gradient(90deg, #ff2222, #cc004e)",
          }}
        />
        {/* Center marker */}
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/20" />
        {/* YES label inside */}
        <span className="absolute left-2 top-1/2 -translate-y-1/2 font-sans text-[10px] font-bold text-white drop-shadow-md">
          {COPY.bet.yes} {yesPct}%
        </span>
        {/* NO label inside */}
        <span className="absolute right-2 top-1/2 -translate-y-1/2 font-sans text-[10px] font-bold text-white drop-shadow-md">
          {100 - yesPct}% {COPY.bet.no}
        </span>
      </motion.div>
    </div>
  );
}
