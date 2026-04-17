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
  const isYes = side === "yes";
  const color = isYes ? "text-yes-glow text-glow-yes" : "text-no-glow text-glow-no";
  const borderColor = isYes ? "border-yes/50" : "border-no/50";
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
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent bg-surface shadow-2xl shadow-accent/50 border-glow-accent">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-glow to-accent" />
            </div>
            <h2 className="font-display text-xl uppercase tracking-[0.2em] text-accent-glow text-glow-accent">
              {COPY.oracle.sealed}
            </h2>
            <div
              className={`rounded-lg border ${borderColor} px-6 py-2 font-display text-2xl tracking-[0.15em] ${color}`}
            >
              {side === "yes" ? COPY.bet.yes : COPY.bet.no}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
