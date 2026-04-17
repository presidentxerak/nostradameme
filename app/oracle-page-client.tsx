"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { OracleCharacter } from "@/components/oracle-character";
import { ProphecyCard } from "@/components/prophecy-card";
import { LiveFeedTicker } from "@/components/live-feed-ticker";
import { BetSheet } from "@/components/bet-sheet";
import { ProphecySealed } from "@/components/prophecy-sealed";
import { RevealAnimation } from "@/components/reveal-animation";
import { OnrampWidget } from "@/components/onramp-widget";
import { BottomNav } from "@/components/bottom-nav";
import { COPY } from "@/lib/config/copy";
import { useMarketPools } from "@/lib/hooks/use-market-pools";
import { useBalance } from "@/lib/hooks/use-balance";
import { useMarketResolution } from "@/lib/hooks/use-market-resolution";
import { useLiveFeed } from "@/lib/hooks/use-live-feed";
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
  // Auto-select the first open slot — no manual tabs.
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
  const [onrampOpen, setOnrampOpen] = useState(false);
  const [revealVisible, setRevealVisible] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [userPositionSide, setUserPositionSide] = useState<MarketSide | null>(
    current?.userPositionSide ?? null,
  );
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
      if (!props.isAuthed) {
        setAuthPrompt(true);
        setTimeout(() => setAuthPrompt(false), 3000);
        return;
      }
      setBetSide(side);
      setBetOpen(true);
    },
    [props.isAuthed],
  );

  const handleConfirmBet = useCallback(
    async (amount: number) => {
      if (!current?.market || !betSide) return;
      const res = await fetch("/api/positions/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
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
    [betSide, current?.market],
  );

  const handleAddFunds = useCallback(() => {
    if (!props.isAuthed) {
      setAuthPrompt(true);
      setTimeout(() => setAuthPrompt(false), 3000);
      return;
    }
    setBetOpen(false);
    setOnrampOpen(true);
  }, [props.isAuthed]);

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
    <div className="relative flex h-[100dvh] flex-col bg-background overflow-hidden">
      {authPrompt && (
        <div className="border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-xs text-accent-glow">
          {COPY.auth.signInPrompt}
        </div>
      )}

      {props.refUsername && (
        <div className="border-b border-border/30 bg-accent/5 px-4 py-1.5 text-center text-xs text-accent-glow">
          {COPY.share.refBanner(
            `@${props.refUsername}`,
            userPositionSide === "yes" ? COPY.bet.yes : COPY.bet.no,
          )}
        </div>
      )}

      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto px-4 pb-20">
        <div className="mx-auto flex max-w-lg flex-col items-center">
          {/* Square image placeholder */}
          <div className="mt-3 w-full max-w-[280px] sm:max-w-[320px]">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/30 bg-surface/40">
              <OracleCharacter
                pools={pools}
                status={market?.status ?? "draft"}
                className="h-full w-full"
              />
            </div>
          </div>

          {/* Live feed — centered between image and card */}
          <div className="my-3 w-full">
            <LiveFeedTicker feed={feed} />
          </div>

          {/* Prophecy card */}
          <div className="w-full">
            <AnimatePresence mode="wait">
              {market && pools ? (
                <ProphecyCard
                  key={market.id}
                  market={market}
                  pools={pools}
                  onBet={handleBet}
                />
              ) : (
                <div className="rounded-2xl border border-border/40 bg-surface/60 p-8 text-center">
                  <p className="text-base text-text-muted">{COPY.oracle.silent}</p>
                </div>
              )}
            </AnimatePresence>
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

      <OnrampWidget open={onrampOpen} onOpenChange={setOnrampOpen} />

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
