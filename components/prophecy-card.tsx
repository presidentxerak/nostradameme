"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TugOfWar } from "@/components/tug-of-war";
import { YesNoButtons } from "@/components/yes-no-buttons";
import { CountdownGauge } from "@/components/countdown-gauge";
import { msUntil, formatRemainingLong } from "@/lib/utils/dates";
import { DURATION_LABELS } from "@/lib/markets/duration-labels";
import type { MarketWithAsset, MarketPools } from "@/types/app";

interface ProphecyCardProps {
  market: MarketWithAsset;
  pools: MarketPools;
  onBet: (side: "yes" | "no") => void;
  onExpired?: () => void;
  disabled?: boolean;
}

export function ProphecyCard({
  market,
  pools,
  onBet,
  onExpired,
  disabled = false,
}: ProphecyCardProps) {
  const bettingEnd = market.betting_end_at ?? market.end_at;
  const [msLeft, setMsLeft] = useState(() => msUntil(bettingEnd));
  const [resolutionCountdown, setResolutionCountdown] = useState(() =>
    formatRemainingLong(market.end_at),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMsLeft(msUntil(bettingEnd));
      setResolutionCountdown(formatRemainingLong(market.end_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [bettingEnd, market.end_at]);

  const bettingClosed = msLeft <= 0;
  const durationLabel = market.duration
    ? DURATION_LABELS[market.duration as keyof typeof DURATION_LABELS] ?? market.duration
    : null;

  const handleExpired = useCallback(() => {
    onExpired?.();
  }, [onExpired]);

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
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-text-muted">
              End of prediction in: <span className="font-bold text-accent-glow">{durationLabel}</span>
            </span>
            <span className="font-mono text-xs font-bold text-accent-glow">
              {resolutionCountdown}
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
          onExpired={handleExpired}
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
