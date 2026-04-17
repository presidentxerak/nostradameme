"use client";

import { motion } from "framer-motion";
import { COPY } from "@/lib/config/copy";

interface YesNoButtonsProps {
  onBet: (side: "yes" | "no") => void;
  disabled?: boolean;
  yesPct?: number;
  noPct?: number;
}

export function YesNoButtons({
  onBet,
  disabled = false,
  yesPct,
  noPct,
}: YesNoButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        whileHover={{ scale: disabled ? 1 : 1.03 }}
        disabled={disabled}
        onClick={() => onBet("yes")}
        className="group relative flex h-16 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border border-yes/40 bg-gradient-to-b from-yes/20 to-yes-dim/10 text-yes-glow transition-all hover:border-yes-glow/60 disabled:opacity-40 animate-glow-yes"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yes/5 to-transparent bg-shimmer-size animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative font-display text-xl tracking-[0.2em] font-bold text-glow-yes">
          {COPY.bet.yes}
        </span>
        {typeof yesPct === "number" && (
          <span className="relative font-mono text-[10px] text-yes/80">{yesPct}%</span>
        )}
      </motion.button>
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        whileHover={{ scale: disabled ? 1 : 1.03 }}
        disabled={disabled}
        onClick={() => onBet("no")}
        className="group relative flex h-16 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border border-no/40 bg-gradient-to-b from-no/20 to-no-dim/10 text-no-glow transition-all hover:border-no-glow/60 disabled:opacity-40 animate-glow-no"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-no/5 to-transparent bg-shimmer-size animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative font-display text-xl tracking-[0.2em] font-bold text-glow-no">
          {COPY.bet.no}
        </span>
        {typeof noPct === "number" && (
          <span className="relative font-mono text-[10px] text-no/80">{noPct}%</span>
        )}
      </motion.button>
    </div>
  );
}
