"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="border-accent/30 bg-gradient-to-b from-surface/90 to-surface/60 shadow-2xl shadow-accent/20">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">{slotMeta.emoji}</span>
          <span className="font-display text-sm uppercase tracking-widest text-accent-glow">
            {slotMeta.label}
          </span>
          <span className="ml-auto font-mono text-xs text-text-muted">
            {market.asset.asset_key}
          </span>
        </div>

        <h2 className="mb-2 text-2xl font-semibold leading-snug text-text-primary">
          {market.question}
        </h2>

        <p className="mb-3 italic text-text-muted">
          &ldquo;{market.oracle_quote}&rdquo;
        </p>

        <TugOfWar pools={pools} />

        <div className="my-4">
          <YesNoButtons
            onBet={onBet}
            disabled={disabled || locked}
            yesPct={pools.yesPct}
            noPct={pools.noPct}
          />
        </div>

        <div
          className={`flex items-center justify-center gap-2 font-mono text-sm ${countdownColor}`}
        >
          {locked ? (
            <span className="font-bold">{COPY.oracle.locked}</span>
          ) : (
            <>
              <span>{"\u23f1"}</span>
              <span>
                {remaining} {COPY.oracle.remaining}
              </span>
            </>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
