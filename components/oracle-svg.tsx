"use client";

import { motion } from "framer-motion";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion";
import type { OracleState } from "@/types/app";

interface OracleSvgProps {
  state: OracleState;
  className?: string;
}

const STATE_COLORS: Record<OracleState, { eye: string; orb: string; aura: string }> = {
  bullish: { eye: "#00ffbb", orb: "#00e5a0", aura: "#00e5a033" },
  bearish: { eye: "#ff5ca1", orb: "#ff2d7a", aura: "#ff2d7a33" },
  uncertain: { eye: "#fbbf24", orb: "#f59e0b", aura: "#f59e0b33" },
  balanced: { eye: "#a78bfa", orb: "#8b5cf6", aura: "#8b5cf633" },
  dormant: { eye: "#4a4a60", orb: "#1a1a2e", aura: "#1a1a2e22" },
};

export function OracleSvg({ state, className }: OracleSvgProps) {
  const reduce = useReducedMotionPreference();
  const c = STATE_COLORS[state];

  return (
    <motion.svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={{ scale: state === "dormant" ? 0.97 : 1 }}
      transition={{ duration: 0.6 }}
    >
      <defs>
        <radialGradient id="orbG" cx="50%" cy="40%">
          <stop offset="0%" stopColor={c.orb} />
          <stop offset="70%" stopColor={c.aura} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="cloak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="100%" stopColor="#06060c" />
        </linearGradient>
        <filter id="orbBlur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* Outer aura ring */}
      <motion.circle
        cx="100" cy="90" r="75"
        fill="none" stroke={c.aura} strokeWidth="1"
        opacity="0.4"
        animate={reduce ? undefined : { scale: [1, 1.06, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ transformOrigin: "100px 90px" }}
      />
      {/* Cloak */}
      <path
        d="M45 190 Q45 110 100 60 Q155 110 155 190 Z"
        fill="url(#cloak)" stroke="#2a2a40" strokeWidth="1.5"
      />
      {/* Hood */}
      <ellipse cx="100" cy="72" rx="38" ry="42" fill="#0a0a14" stroke="#2a2a40" strokeWidth="1.5" />
      {/* Face void */}
      <ellipse cx="100" cy="78" rx="24" ry="30" fill="#04040a" />
      {/* Eyes */}
      <motion.circle
        cx="90" cy="76" r="3"
        fill={c.eye}
        animate={reduce ? undefined : state === "dormant"
          ? { opacity: [0.15, 0.3, 0.15] }
          : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle
        cx="110" cy="76" r="3"
        fill={c.eye}
        animate={reduce ? undefined : state === "dormant"
          ? { opacity: [0.15, 0.3, 0.15] }
          : { opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />
      {/* Orb glow */}
      <circle cx="100" cy="140" r="20" fill={c.aura} filter="url(#orbBlur)" opacity="0.6" />
      {/* Orb */}
      <motion.circle
        cx="100" cy="140" r="14"
        fill="url(#orbG)" stroke={c.orb} strokeWidth="1.5"
        animate={reduce ? undefined : { scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ transformOrigin: "100px 140px" }}
      />
      {/* Orb inner highlight */}
      <circle cx="96" cy="135" r="4" fill="white" opacity="0.15" />
    </motion.svg>
  );
}
