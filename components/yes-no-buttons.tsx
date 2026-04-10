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
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        disabled={disabled}
        onClick={() => onBet("yes")}
        className="group relative flex h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-yes text-white shadow-lg shadow-yes/30 transition-all hover:bg-yes-glow disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{COPY.bet.yesEmoji}</span>
          <span className="font-display text-2xl tracking-widest">
            {COPY.bet.yes}
          </span>
        </div>
        {typeof yesPct === "number" && (
          <span className="font-mono text-xs opacity-80">{yesPct}%</span>
        )}
      </motion.button>
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.97 }}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        disabled={disabled}
        onClick={() => onBet("no")}
        className="group relative flex h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-no text-white shadow-lg shadow-no/30 transition-all hover:bg-no-glow disabled:opacity-50"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{COPY.bet.noEmoji}</span>
          <span className="font-display text-2xl tracking-widest">
            {COPY.bet.no}
          </span>
        </div>
        {typeof noPct === "number" && (
          <span className="font-mono text-xs opacity-80">{noPct}%</span>
        )}
      </motion.button>
    </div>
  );
}
