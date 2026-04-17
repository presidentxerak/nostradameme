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
        whileTap={{ scale: disabled ? 1 : 0.93 }}
        whileHover={{ scale: disabled ? 1 : 1.04 }}
        disabled={disabled}
        onClick={() => onBet("yes")}
        className="group relative flex h-20 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 border-yes/50 text-white transition-all hover:border-yes-glow disabled:opacity-30 animate-glow-yes"
        style={{ background: "linear-gradient(135deg, #00cc9e 0%, #00d4ff 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent bg-shimmer-size animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative text-2xl font-bold tracking-[0.25em] text-glow-yes">
          {COPY.bet.yes}
        </span>
        {typeof yesPct === "number" && (
          <span className="relative text-sm text-white/80">{yesPct}%</span>
        )}
      </motion.button>
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.93 }}
        whileHover={{ scale: disabled ? 1 : 1.04 }}
        disabled={disabled}
        onClick={() => onBet("no")}
        className="group relative flex h-20 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 border-no/50 text-white transition-all hover:border-no-glow disabled:opacity-30 animate-glow-no"
        style={{ background: "linear-gradient(135deg, #cc004e 0%, #ff2222 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent bg-shimmer-size animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative text-2xl font-bold tracking-[0.25em] text-glow-no">
          {COPY.bet.no}
        </span>
        {typeof noPct === "number" && (
          <span className="relative text-sm text-white/80">{noPct}%</span>
        )}
      </motion.button>
    </div>
  );
}
