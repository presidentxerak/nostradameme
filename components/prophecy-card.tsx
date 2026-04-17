"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TugOfWar } from "@/components/tug-of-war";
import { YesNoButtons } from "@/components/yes-no-buttons";
import { COPY } from "@/lib/config/copy";
import { formatRemaining, msUntil } from "@/lib/utils/dates";
import type { MarketWithAsset, MarketPools } from "@/types/app";

interface ProphecyCardProps {
  market: MarketWithAsset;
  pools: MarketPools;
  onBet: (side: "yes" | "no") => void;
  disabled?: boolean;
}

const SLOT_META = {
  morning: COPY.slots.morning,
  noon: COPY.slots.noon,
  night: COPY.slots.night,
  weekly: COPY.slots.weekly,
} as const;

export function ProphecyCard({
  market,
  pools,
  onBet,
  disabled = false,
}: ProphecyCardProps) {
  const [remaining, setRemaining] = useState(() =>
    formatRemaining(market.end_at),
  );
  const [msLeft, setMsLeft] = useState(() => msUntil(market.end_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(formatRemaining(market.end_at));
      setMsLeft(msUntil(market.end_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [market.end_at]);

  const locked = market.status === "locked" || msLeft <= 5 * 60 * 1000;
  const slotMeta = SLOT_META[market.slot];
  const countdownColor =
    msLeft < 5 * 60 * 1000
      ? "text-no-glow"
      : msLeft < 60 * 60 * 1000
        ? "text-gold-glow"
        : "text-text-secondary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl border border-accent-dim/30 bg-surface/80 backdrop-blur-sm p-5 border-glow-accent">
        {/* Header row */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs tracking-widest text-accent-glow uppercase">
            {slotMeta.label}
          </span>
          <span className="text-xs text-text-muted">
            {market.asset.asset_key}
          </span>
        </div>

        {/* Question — Jacquard font, first-letter capitalized only */}
        <h2 className="mb-2 font-display text-xl leading-snug text-text-primary sm:text-2xl capitalize-first">
          {market.question}
        </h2>

        {/* Oracle quote */}
        <p className="mb-4 text-sm italic text-text-muted leading-relaxed">
          &ldquo;{market.oracle_quote}&rdquo;
        </p>

        {/* Tug of war */}
        <TugOfWar pools={pools} />

        {/* YES / NO buttons */}
        <div className="mt-3">
          <YesNoButtons
            onBet={onBet}
            disabled={disabled || locked}
            yesPct={pools.yesPct}
            noPct={pools.noPct}
          />
        </div>

        {/* Countdown */}
        <div
          className={`mt-2 text-center font-mono text-xs ${countdownColor}`}
        >
          {locked ? (
            <span className="font-bold">{COPY.oracle.locked}</span>
          ) : (
            <span>{remaining} {COPY.oracle.remaining}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
