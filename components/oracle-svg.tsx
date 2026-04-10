"use client";

import { motion } from "framer-motion";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion";
import type { OracleState } from "@/types/app";

interface OracleSvgProps {
  state: OracleState;
  className?: string;
}

const STATE_COLORS: Record<OracleState, { eye: string; orb: string; aura: string }> = {
  bullish: { eye: "#34d399", orb: "#10b981", aura: "#10b98166" },
  bearish: { eye: "#f87171", orb: "#ef4444", aura: "#ef444466" },
  uncertain: { eye: "#fbbf24", orb: "#f59e0b", aura: "#f59e0b66" },
  balanced: { eye: "#9d5cf0", orb: "#7c3aed", aura: "#7c3aed66" },
  dormant: { eye: "#475569", orb: "#1e1e2e", aura: "#1e1e2e66" },
};

export function OracleSvg({ state, className }: OracleSvgProps) {
  const reduce = useReducedMotionPreference();
  const colors = STATE_COLORS[state];
  const eyeOffset =
    state === "uncertain" ? { x: [-3, 3, -3] } : { x: 0 };
  const armRaise = state === "bullish" ? -15 : state === "bearish" ? 10 : 0;

  return (
    <motion.svg
      viewBox="0 0 320 380"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      initial={false}
      animate={{
        scale: state === "dormant" ? 0.96 : 1,
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <defs>
        <radialGradient id="orbGradient" cx="50%" cy="40%">
          <stop offset="0%" stopColor={colors.orb} stopOpacity="1" />
          <stop offset="60%" stopColor={colors.aura} />
          <stop offset="100%" stopColor="#0a0a0f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cloak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e1e2e" />
          <stop offset="100%" stopColor="#0a0a0f" />
        </linearGradient>
      </defs>
      {/* Aura */}
      <motion.circle
        cx="160"
        cy="160"
        r="140"
        fill={colors.aura}
        opacity="0.25"
        animate={
          reduce
            ? undefined
            : { scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }
        }
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Cloak body */}
      <motion.path
        d="M60 360 Q60 200 160 100 Q260 200 260 360 Z"
        fill="url(#cloak)"
        stroke="#2a2a3e"
        strokeWidth="2"
        animate={{ rotate: reduce ? 0 : state === "uncertain" ? [-1, 1, -1] : 0 }}
        style={{ originX: 0.5, originY: 1 }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      {/* Hood */}
      <ellipse cx="160" cy="130" rx="62" ry="68" fill="#0a0a0f" stroke="#2a2a3e" strokeWidth="2" />
      {/* Face shadow */}
      <ellipse cx="160" cy="140" rx="40" ry="50" fill="#05050a" />
      {/* Eyes */}
      <motion.g
        animate={eyeOffset}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        <motion.circle
          cx="142"
          cy="138"
          r="6"
          fill={colors.eye}
          animate={
            reduce
              ? undefined
              : state === "dormant"
                ? { opacity: [0.2, 0.4, 0.2] }
                : { opacity: [0.6, 1, 0.6] }
          }
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="178"
          cy="138"
          r="6"
          fill={colors.eye}
          animate={
            reduce
              ? undefined
              : state === "dormant"
                ? { opacity: [0.2, 0.4, 0.2] }
                : { opacity: [0.6, 1, 0.6] }
          }
          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
        />
      </motion.g>
      {/* Arms holding orb */}
      <motion.path
        d={`M90 290 Q130 260 160 ${260 + armRaise} Q190 260 230 290`}
        stroke="#2a2a3e"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: reduce ? 0 : armRaise }}
        style={{ originX: 0.5, originY: 0.72 }}
      />
      {/* Orb */}
      <motion.circle
        cx="160"
        cy={260 + armRaise}
        r="32"
        fill="url(#orbGradient)"
        stroke={colors.orb}
        strokeWidth="2"
        animate={
          reduce
            ? undefined
            : state === "dormant"
              ? { scale: [0.95, 1, 0.95] }
              : { scale: [1, 1.08, 1] }
        }
        style={{ originX: 0.5, originY: 0.72 }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Inner orb sparkle */}
      <circle cx="150" cy={252 + armRaise} r="6" fill="#ffffff88" />
    </motion.svg>
  );
}
