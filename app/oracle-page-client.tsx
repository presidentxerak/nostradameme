"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { OracleVideo } from "@/components/oracle-video";
import { ProphecyCard } from "@/components/prophecy-card";
import { LiveFeedTicker } from "@/components/live-feed-ticker";
import { BetSheet } from "@/components/bet-sheet";
import { ProphecySealed } from "@/components/prophecy-sealed";
import { RevealAnimation } from "@/components/reveal-animation";
import { DepositChooser } from "@/components/deposit-chooser";
import { BottomNav } from "@/components/bottom-nav";
import { AuthButton } from "@/components/auth-button";
import { COPY } from "@/lib/config/copy";
import { useMarketPools } from "@/lib/hooks/use-market-pools";
import { useBalance } from "@/lib/hooks/use-balance";
import { useMarketResolution } from "@/lib/hooks/use-market-resolution";
import { useLiveFeed } from "@/lib/hooks/use-live-feed";
import { useGetToken } from "@/app/providers";
import { formatUsd } from "@/lib/utils/currency";
import type { LiveFeedEntry, MarketPools, MarketWithAsset } from "@/types/app";
import type { MarketSide } from "@/types/db";

type SlotKey = "morning" | "noon" | "night";

export interface OraclePageSlotData {
  slot: SlotKey;
  market: MarketWithAsset | null;
  pools: MarketPools | null;
  feed: LiveFeedEntry[];
  userHasPosition: boolean;
  userPositionSide: MarketSide | null;
  userPositionAmount: number | null;
}

export interface OraclePageClientProps {
  slots: OraclePageSlotData[];
  userId: string | null;
  username: string;
  initialBalance: number;
  isAuthed: boolean;
  refUsername: string | null;
}

export function OraclePageClient(props: OraclePageClientProps) {
  const current = useMemo(() => {
    const open = props.slots.find(
      (s) => s.market && s.market.status === "open",
    );
    return open ?? props.slots.find((s) => s.market) ?? props.slots[0] ?? null;
  }, [props.slots]);

  const pools = useMarketPools(
    current?.market?.id ?? null,
    current?.pools ?? null,
  );
  const feed = useLiveFeed(
    current?.market?.id ?? null,
    current?.feed ?? [],
  );
  const balance = useBalance(props.userId, props.initialBalance);
  const resolution = useMarketResolution(
    current?.market?.id ?? null,
    current?.market?.status ?? "draft",
    current?.market?.resolution_side ?? null,
    current?.market?.closing_price ? Number(current.market.closing_price) : null,
  );

  const [betSide, setBetSide] = useState<MarketSide | null>(null);
  const [betOpen, setBetOpen] = useState(false);
  const [sealed, setSealed] = useState<MarketSide | null>(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositMode, setDepositMode] = useState<"sol" | "xrp" | null>(null);
  const [revealVisible, setRevealVisible] = useState(false);
  const [userPositionSide, setUserPositionSide] = useState<MarketSide | null>(
    current?.userPositionSide ?? null,
  );
  const getToken = useGetToken();
  const [userPositionAmount, setUserPositionAmount] = useState<number>(
    current?.userPositionAmount ?? 0,
  );

  useEffect(() => {
    setUserPositionSide(current?.userPositionSide ?? null);
    setUserPositionAmount(current?.userPositionAmount ?? 0);
  }, [current?.userPositionSide, current?.userPositionAmount]);

  useEffect(() => {
    if (resolution.resolved && resolution.resolutionSide && current?.market) {
      setRevealVisible(true);
    }
  }, [resolution.resolved, resolution.resolutionSide, current?.market]);

  const handleBet = useCallback(
    (side: MarketSide) => {
      setBetSide(side);
      setBetOpen(true);
    },
    [],
  );

  const handleConfirmBet = useCallback(
    async (amount: number) => {
      if (!current?.market || !betSide) return;
      const token = await getToken();
      const res = await fetch("/api/positions/create", {
        method: "POST",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          marketId: current.market.id,
          side: betSide,
          amount,
        }),
      });
      const data = (await res.json()) as
        | { positionId: string; newBalance: number }
        | { error: { message: string } };
      if (!res.ok) {
        const msg =
          "error" in data ? data.error.message : COPY.errors.generic;
        throw new Error(msg);
      }
      setSealed(betSide);
      setUserPositionSide(betSide);
      setUserPositionAmount(amount);
      setTimeout(() => setSealed(null), 1200);
    },
    [betSide, current?.market, getToken],
  );

  const handleAddFunds = useCallback((method?: "sol" | "xrp") => {
    setBetOpen(false);
    setDepositMode(method ?? null);
    setDepositOpen(true);
  }, []);

  const market = current?.market ?? null;

  const userWon = useMemo(() => {
    if (!resolution.resolved || !resolution.resolutionSide) return null;
    if (!userPositionSide) return null;
    return userPositionSide === resolution.resolutionSide;
  }, [resolution, userPositionSide]);

  const winAmount = useMemo(() => {
    if (!userWon || !pools || !userPositionSide) return 0;
    const winningPool =
      resolution.resolutionSide === "yes" ? pools.yesPool : pools.noPool;
    if (winningPool <= 0) return userPositionAmount;
    const totalPool = pools.totalVolume;
    const fee = totalPool * 0.05;
    const distributable = totalPool - fee;
    return (userPositionAmount / winningPool) * distributable;
  }, [userWon, pools, userPositionSide, userPositionAmount, resolution]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      {/* Top bar: logo + balance + auth */}
      <header className="z-40 flex items-center justify-between px-4 py-2 border-b border-border/20">
        <div className="flex items-center gap-2">
          <img src="/logo-nostradameme.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-display text-2xl sm:text-3xl text-white">
            {COPY.header.logo}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/rules" className="text-xs text-white/60 hover:text-white transition-colors">
            Rules
          </Link>
          {props.isAuthed && (
            <span className="text-sm text-text-primary font-bold">
              {formatUsd(balance)}
            </span>
          )}
          <AuthButton />
        </div>
      </header>

      {props.refUsername && (
        <div className="border-b border-border/30 bg-accent/5 px-4 py-1.5 text-center text-xs text-accent-glow">
          {COPY.share.refBanner(
            `@${props.refUsername}`,
            userPositionSide === "yes" ? COPY.bet.yes : COPY.bet.no,
          )}
        </div>
      )}

      {/* Main content — video + overlapping card */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          {/* Oracle video + quote overlay */}
          <div className="w-full relative">
            <OracleVideo
              startAt={market?.start_at ?? null}
              endAt={market?.end_at ?? null}
              className="aspect-[4/3] w-full"
            />
            {/* Oracle quote overlaid on video */}
            {market && (
              <div className="absolute bottom-14 left-0 right-0 px-6 text-center">
                <p className="text-sm italic text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-relaxed">
                  &ldquo;{market.oracle_quote}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Prophecy card — overlaps the video by pulling up */}
          <div className="w-full px-3 -mt-10 relative z-10">
            <AnimatePresence mode="wait">
              {market && pools ? (
                <ProphecyCard
                  key={market.id}
                  market={market}
                  pools={pools}
                  onBet={handleBet}
                />
              ) : (
                <div className="rounded-2xl border border-border/40 bg-surface/90 backdrop-blur-md p-6 text-center space-y-3">
                  <p className="text-lg text-text-secondary font-bold">{COPY.oracle.silent}</p>
                  <p className="text-sm text-text-muted">
                    Next prophecy at 9:00 AM, 12:00 PM, or midnight.
                    Enable notifications to never miss one.
                  </p>
                  <Link href="/rules" className="inline-block text-sm text-accent-glow hover:underline">
                    How does it work?
                  </Link>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Live feed */}
          <div className="mt-3 w-full px-3">
            <LiveFeedTicker feed={feed} />
          </div>
        </div>
      </main>

      {/* Bottom navigation */}
      <BottomNav active="oracle" />

      <BetSheet
        open={betOpen}
        onOpenChange={setBetOpen}
        market={market}
        pools={pools}
        side={betSide}
        balance={balance}
        onConfirm={handleConfirmBet}
        onAddFunds={handleAddFunds}
      />

      <DepositChooser
        open={depositOpen}
        onOpenChange={setDepositOpen}
        mode={depositMode}
        onModeChange={setDepositMode}
        onComplete={() => {
          if (betSide) setBetOpen(true);
        }}
      />
      <ProphecySealed visible={sealed !== null} side={sealed} />

      <RevealAnimation
        visible={revealVisible}
        resolutionSide={resolution.resolutionSide}
        userWon={userWon}
        winAmount={winAmount}
        marketQuestion={market?.question ?? ""}
        marketId={market?.id ?? ""}
        username={props.username}
        onDismiss={() => setRevealVisible(false)}
        hasPosition={userPositionSide !== null}
      />
    </div>
  );
}
