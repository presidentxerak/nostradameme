"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Confetti } from "@/components/confetti";
import { OracleSvg } from "@/components/oracle-svg";
import { ShareProphecyButton } from "@/components/share-prophecy-button";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion";
import type { MarketSide } from "@/types/db";

interface RevealAnimationProps {
  visible: boolean;
  resolutionSide: MarketSide | null;
  userWon: boolean | null;
  winAmount: number;
  marketQuestion: string;
  marketId: string;
  username: string;
  onDismiss: () => void;
  hasPosition: boolean;
}

export function RevealAnimation(props: RevealAnimationProps) {
  const reduce = useReducedMotionPreference();
  const [step, setStep] = useState(0);
  const { visible } = props;

  useEffect(() => {
    if (!visible) {
      setStep(0);
      return;
    }
    const schedule: Array<[number, number]> = props.hasPosition
      ? [
          [0, 0],
          [1, 500],
          [2, 1300],
          [3, 2300],
          [4, 2500],
          [5, 2800],
          [6, 3300],
          [7, 3500],
          [8, 4300],
          [9, 4500],
        ]
      : [
          [0, 0],
          [1, 400],
          [2, 900],
          [3, 1500],
          [4, 1700],
          [5, 1900],
          [6, 2300],
          [7, 2500],
        ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const [stepIdx, delay] of schedule) {
      const ms = reduce ? Math.min(delay, 300) : delay;
      timers.push(setTimeout(() => setStep(stepIdx), ms));
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [visible, reduce, props.hasPosition]);

  if (!visible || !props.resolutionSide) return null;
  const isYes = props.resolutionSide === "yes";
  const sideColor = isYes ? "text-yes-glow" : "text-no-glow";
  const sideBg = isYes ? "bg-yes/10" : "bg-no/10";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.96 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg"
        onClick={props.onDismiss}
      >
        {/* Lightning flash */}
        {step >= 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 bg-white"
          />
        )}

        <div className="relative mx-auto flex max-w-md flex-col items-center px-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: step >= 2 ? 1 : 0.5,
              opacity: step >= 1 ? 1 : 0,
            }}
            transition={{ duration: 0.8 }}
          >
            <OracleSvg
              state={isYes ? "bullish" : "bearish"}
              className="h-64 w-64"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: step >= 5 ? 1 : 0,
              y: step >= 5 ? 0 : 20,
            }}
            transition={{ duration: 0.4 }}
            className="mt-4 font-display text-3xl tracking-widest text-accent-glow"
          >
            {COPY.reveal.heading}
          </motion.h2>

          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{
              y: step >= 7 ? 0 : -60,
              opacity: step >= 7 ? 1 : 0,
            }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            className={`mt-5 rounded-2xl border px-6 py-3 ${sideBg} ${sideColor} font-sans text-2xl font-bold`}
          >
            {isYes ? COPY.reveal.yesWon : COPY.reveal.noWon}
          </motion.div>

          {props.hasPosition && step >= 9 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="mt-6 flex flex-col items-center gap-3"
            >
              {props.userWon ? (
                <>
                  <Confetti />
                  <p className="font-display text-xl text-gold-glow">
                    {COPY.reveal.youWon}
                  </p>
                  <p className="font-mono text-4xl text-gold">
                    +{formatUsd(props.winAmount)}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {COPY.oracle.won}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-xl text-text-secondary">
                    {COPY.reveal.youLost}
                  </p>
                  <p className="text-sm text-text-muted">
                    {COPY.oracle.lost}
                  </p>
                </>
              )}
              <div
                onClick={(e) => e.stopPropagation()}
                className="mt-2 flex flex-col items-center gap-2"
              >
                <ShareProphecyButton
                  marketId={props.marketId}
                  side={props.resolutionSide}
                  username={props.username}
                  won={props.userWon ?? false}
                  amount={props.winAmount}
                  marketQuestion={props.marketQuestion}
                />
              </div>
            </motion.div>
          )}

          <p className="mt-8 text-xs text-text-muted">
            {COPY.reveal.dismiss}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
