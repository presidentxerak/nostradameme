"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TugOfWar } from "@/components/tug-of-war";
import { YesNoButtons } from "@/components/yes-no-buttons";
import { CountdownGauge } from "@/components/countdown-gauge";
import { CryptoIcon } from "@/components/crypto-icon";
import { COPY } from "@/lib/config/copy";
import { msUntil } from "@/lib/utils/dates";
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

  const locked = market.status === "locked" || msLeft <= 5 * 60 * 1000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl border border-accent-dim/30 bg-surface/90 backdrop-blur-md px-4 py-3 border-glow-accent">
        {/* Ticker + crypto icon */}
        <div className="mb-2 flex items-center gap-2">
          <CryptoIcon coingeckoId={market.asset.coingecko_id} size={28} />
          <span className="text-lg font-bold text-text-primary tracking-wide">
            {market.asset.asset_key}
          </span>
        </div>

        {/* Question */}
        <h2 className="mb-2 font-display text-xl leading-snug text-text-primary sm:text-2xl">
          {market.question}
        </h2>

        {/* Oracle quote */}
        <p className="mb-3 text-xs italic text-text-muted leading-relaxed">
          &ldquo;{market.oracle_quote}&rdquo;
        </p>

        {/* Countdown gauge — time remaining */}
        <CountdownGauge
          startAt={market.start_at}
          endAt={market.end_at}
          slot={market.slot}
          locked={locked}
        />

        {/* YES/NO tug of war gauge */}
        <div className="mt-1.5">
          <TugOfWar pools={pools} />
        </div>

        {/* YES / NO buttons */}
        <div className="mt-2">
          <YesNoButtons
            onBet={onBet}
            disabled={disabled || locked}
            yesPct={pools.yesPct}
            noPct={pools.noPct}
          />
        </div>
      </div>
    </motion.div>
  );
}
