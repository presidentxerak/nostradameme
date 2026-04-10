"use client";

import { motion } from "framer-motion";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion";

interface ConfettiProps {
  count?: number;
}

export function Confetti({ count = 40 }: ConfettiProps) {
  const reduce = useReducedMotionPreference();
  if (reduce) return null;
  const coins = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {coins.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duration = 1.2 + Math.random() * 1.3;
        const size = 12 + Math.random() * 12;
        return (
          <motion.div
            key={i}
            initial={{ y: -40, opacity: 0, rotate: 0 }}
            animate={{
              y: "120vh",
              opacity: [0, 1, 1, 0],
              rotate: 720,
            }}
            transition={{ duration, delay, ease: "easeIn" }}
            style={{
              left: `${left}%`,
              width: size,
              height: size,
            }}
            className="absolute rounded-full bg-gradient-to-br from-gold-glow to-gold shadow-lg shadow-gold/40"
          />
        );
      })}
    </div>
  );
}
