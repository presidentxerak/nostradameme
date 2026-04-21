"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TugOfWar } from "@/components/tug-of-war";
import { YesNoButtons } from "@/components/yes-no-buttons";
import { CountdownGauge } from "@/components/countdown-gauge";
import { msUntil } from "@/lib/utils/dates";
import { DURATION_LABELS } from "@/lib/markets/duration-labels";
import type { MarketWithAsset, MarketPools } from "@/types/app";

interface ProphecyCardProps {
  market: MarketWithAsset;
  pools: MarketPools;
  onBet: (side: "yes" | "no") => void;
  disabled?: boolean;
}

export function ProphecyCard({
  market,
  pools,
  onBet,
  disabled = false,
}: ProphecyCardProps) {
  const bettingEnd = market.betting_end_at ?? market.end_at;
  const [msLeft, setMsLeft] = useState(() => msUntil(bettingEnd));

  useEffect(() => {
    const interval = setInterval(() => {
      setMsLeft(msUntil(bettingEnd));
    }, 1000);
    return () => clearInterval(interval);
  }, [bettingEnd]);

  const bettingClosed = msLeft <= 0;
  const durationLabel = market.duration
    ? DURATION_LABELS[market.duration as keyof typeof DURATION_LABELS] ?? market.duration
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl border border-accent-dim/30 bg-surface/90 backdrop-blur-md px-4 py-3 border-glow-accent">
        {durationLabel && (
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent-glow">
              {durationLabel}
            </span>
          </div>
        )}

        <h2 className="mb-3 font-sans text-lg font-bold leading-snug text-text-primary sm:text-xl">
          {market.question}
        </h2>

        <CountdownGauge
          startAt={market.start_at}
          endAt={bettingEnd}
          totalVolume={pools.totalVolume}
          label="Betting closes"
        />

        <div className="mt-1.5">
          <TugOfWar pools={pools} />
        </div>

        <div className="mt-2">
          <YesNoButtons
            onBet={onBet}
            disabled={disabled || bettingClosed}
            yesPct={pools.yesPct}
            noPct={pools.noPct}
          />
        </div>
      </div>
    </motion.div>
  );
}
