"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/utils/currency";
import { COPY } from "@/lib/config/copy";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion";

interface BalanceDisplayProps {
  balance: number;
}

export function BalanceDisplay({ balance }: BalanceDisplayProps) {
  const reduce = useReducedMotionPreference();
  const [displayed, setDisplayed] = useState(balance);

  useEffect(() => {
    if (reduce) {
      setDisplayed(balance);
      return;
    }
    const start = displayed;
    const target = balance;
    if (start === target) return;
    const startTs = performance.now();
    const duration = 600;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(start + (target - start) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, reduce]);

  return (
    <motion.div
      key={balance}
      initial={{ opacity: 0.8 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center"
      aria-label={COPY.header.balanceLabel}
    >
      <span className="font-mono text-sm tracking-tight text-text-primary">
        {formatUsd(displayed)}
      </span>
    </motion.div>
  );
}
