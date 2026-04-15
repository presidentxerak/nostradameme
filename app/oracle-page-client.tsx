"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { OracleCharacter } from "@/components/oracle-character";
import { ProphecyCard } from "@/components/prophecy-card";
import { SlotTabs, type SlotKey } from "@/components/slot-tabs";
import { LiveFeedTicker } from "@/components/live-feed-ticker";
import { BetSheet } from "@/components/bet-sheet";
import { ProphecySealed } from "@/components/prophecy-sealed";
import { RevealAnimation } from "@/components/reveal-animation";
import { OnrampWidget } from "@/components/onramp-widget";
import { BalanceDisplay } from "@/components/balance-display";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/config/copy";
import { useMarketPools } from "@/lib/hooks/use-market-pools";
import { useBalance } from "@/lib/hooks/use-balance";
import { useMarketResolution } from "@/lib/hooks/use-market-resolution";
import { useLiveFeed } from "@/lib/hooks/use-live-feed";
import { isLocked } from "@/lib/utils/dates";
import type { LiveFeedEntry, MarketPools, MarketWithAsset } from "@/types/app";
import type { MarketSide } from "@/types/db";

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

const SLOT_ORDER: SlotKey[] = ["morning", "noon", "night"];

export function OraclePageClient(props: OraclePageClientProps) {
  const [activeSlot, setActiveSlot] = useState<SlotKey>(() => {
    const firstOpen = props.slots.find(
      (s) => s.market && s.market.status === "open",
    );
    return firstOpen?.slot ?? "morning";
  });

  const current = useMemo(
    () => props.slots.find((s) => s.slot === activeSlot),
    [props.slots, activeSlot],
  );

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

  const availability: Record<SlotKey, "open" | "locked" | "upcoming"> = useMemo(() => {
    const rec: Record<SlotKey, "open" | "locked" | "upcoming"> = {
      morning: "upcoming",
      noon: "upcoming",
      night: "upcoming",
    };
    for (const s of SLOT_ORDER) {
      const slot = props.slots.find((x) => x.slot === s);
      if (!slot?.market) {
        rec[s] = "upcoming";
      } else if (
        slot.market.status === "open" &&
        !isLocked(slot.market.end_at)
      ) {
        rec[s] = "open";
      } else {
        rec[s] = "locked";
      }
    }
    return rec;
  }, [props.slots]);

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
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="font-display text-xl tracking-widest text-accent-glow"
        >
          {COPY.header.logo}
        </Link>
        <BalanceDisplay balance={balance} />
        <Button
          size="sm"
          variant="default"
          onClick={handleAddFunds}
          className="whitespace-nowrap"
        >
          {COPY.header.addFunds}
        </Button>
      </header>

      {authPrompt && (
        <div className="border-b border-accent bg-accent/20 px-4 py-3 text-center text-sm text-accent-glow">
          {COPY.auth.signInPrompt}
        </div>
      )}

      {props.refUsername && (
        <div className="border-b border-border bg-accent/10 px-4 py-2 text-center text-xs text-accent-glow">
          {COPY.share.refBanner(
            `@${props.refUsername}`,
            userPositionSide === "yes" ? COPY.bet.yes : COPY.bet.no,
          )}
        </div>
      )}

      <main className="flex-1 px-4 py-4 pb-24">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          {/* Oracle character */}
          <OracleCharacter
            pools={pools}
            status={market?.status ?? "draft"}
          />

          {/* Active prophecy card */}
          <AnimatePresence mode="wait">
            {market && pools ? (
              <ProphecyCard
                key={market.id}
                market={market}
                pools={pools}
                onBet={handleBet}
              />
            ) : (
              <div className="rounded-2xl border border-border bg-surface/60 p-8 text-center text-text-muted">
                {COPY.oracle.silent}
              </div>
            )}
          </AnimatePresence>

          <div className="mt-2">
            <SlotTabs
              active={activeSlot}
              onSelect={setActiveSlot}
              availability={availability}
            />
          </div>

          <nav className="mt-2 flex items-center justify-center gap-4 text-xs text-text-muted">
            <Link href="/profile" className="hover:text-accent-glow">
              {COPY.profile.title}
            </Link>
          </nav>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 safe-bottom">
        <LiveFeedTicker feed={feed} />
      </div>

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
