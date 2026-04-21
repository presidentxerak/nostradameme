"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TugOfWar } from "@/components/tug-of-war";
import { YesNoButtons } from "@/components/yes-no-buttons";
import { CountdownGauge } from "@/components/countdown-gauge";
import { msUntil } from "@/lib/utils/dates";
import { formatUsdCompact } from "@/lib/utils/currency";
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
  const [msLeft, setMsLeft] = useState(() => msUntil(market.end_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setMsLeft(msUntil(market.end_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [market.end_at]);

  const expired = msLeft <= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl border border-accent-dim/30 bg-surface/90 backdrop-blur-md px-4 py-3 border-glow-accent">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-sans text-lg font-bold text-text-primary tracking-wide">
            {market.asset.asset_key}
          </span>
          <span className="font-sans text-lg font-bold text-gold-glow text-glow-gold">
            {formatUsdCompact(pools.totalVolume)}
          </span>
        </div>

        <h2 className="mb-3 font-display text-xl leading-snug text-text-primary sm:text-2xl lowercase first-letter:uppercase">
          {market.question}
        </h2>

        <CountdownGauge
          startAt={market.start_at}
          endAt={market.end_at}
        />

        <div className="mt-1.5">
          <TugOfWar pools={pools} />
        </div>

        <div className="mt-2">
          <YesNoButtons
            onBet={onBet}
            disabled={disabled || expired}
            yesPct={pools.yesPct}
            noPct={pools.noPct}
          />
        </div>
      </div>
    </motion.div>
  );
}
