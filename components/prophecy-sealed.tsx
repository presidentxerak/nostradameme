"use client";

import { motion, AnimatePresence } from "framer-motion";
import { COPY } from "@/lib/config/copy";
import type { MarketSide } from "@/types/db";

interface ProphecySealedProps {
  visible: boolean;
  side: MarketSide | null;
}

export function ProphecySealed({ visible, side }: ProphecySealedProps) {
  if (!side) return null;
  const color = side === "yes" ? "text-yes-glow" : "text-no-glow";
  const emoji = side === "yes" ? COPY.bet.yesEmoji : COPY.bet.noEmoji;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.95 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: -200, rotate: -20, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 180 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-accent bg-surface text-6xl shadow-2xl shadow-accent/50">
              {"\u{1f56f}"}
            </div>
            <h2 className="font-display text-2xl uppercase tracking-widest text-accent-glow">
              {COPY.oracle.sealed}
            </h2>
            <div
              className={`rounded-full border px-4 py-1 font-display text-lg ${color}`}
            >
              {emoji} {side === "yes" ? COPY.bet.yes : COPY.bet.no}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
