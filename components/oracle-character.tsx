"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { OracleSvg } from "@/components/oracle-svg";
import type { OracleState } from "@/types/app";
import type { MarketPools } from "@/types/app";
import type { MarketStatus } from "@/types/db";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

function computeOracleState(
  pools: MarketPools | null,
  status: MarketStatus,
): OracleState {
  if (status !== "open") return "dormant";
  if (!pools || pools.totalVolume === 0) return "balanced";
  const yesPct = pools.yesPct;
  if (yesPct > 65) return "bullish";
  if (yesPct < 35) return "bearish";
  if (yesPct >= 45 && yesPct <= 55) return "uncertain";
  return "balanced";
}

interface OracleCharacterProps {
  pools: MarketPools | null;
  status: MarketStatus;
  className?: string;
}

export function OracleCharacter({
  pools,
  status,
  className,
}: OracleCharacterProps) {
  const [lottieData, setLottieData] = useState<object | null>(null);
  const [lottieFailed, setLottieFailed] = useState(false);
  const state = computeOracleState(pools, status);

  useEffect(() => {
    let alive = true;
    fetch("/lottie/oracle.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: unknown) => {
        if (alive && typeof data === "object" && data) {
          setLottieData(data as object);
        }
      })
      .catch(() => {
        if (alive) setLottieFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const useLottie = lottieData && !lottieFailed;

  return (
    <motion.div
      layout
      className={className}
      aria-label={`oracle-${state}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0.4, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.4, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          {useLottie ? (
            <Lottie
              animationData={lottieData}
              loop
              autoplay
              className="mx-auto h-72 w-72 sm:h-96 sm:w-96"
            />
          ) : (
            <OracleSvg
              state={state}
              className="mx-auto h-72 w-72 sm:h-96 sm:w-96"
            />
          )}
          <ScreenPulse state={state} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function ScreenPulse({ state }: { state: OracleState }) {
  const color =
    state === "bullish"
      ? "rgba(16,185,129,0.18)"
      : state === "bearish"
        ? "rgba(239,68,68,0.18)"
        : state === "uncertain"
          ? "rgba(245,158,11,0.12)"
          : state === "dormant"
            ? "rgba(30,30,46,0.0)"
            : "rgba(124,58,237,0.12)";
  return (
    <motion.div
      key={`pulse-${state}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0] }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `radial-gradient(circle at center, ${color} 0%, transparent 60%)`,
      }}
    />
  );
}
