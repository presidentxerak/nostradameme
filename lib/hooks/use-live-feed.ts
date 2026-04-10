"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { generateMemeUsername } from "@/lib/utils/meme-names";
import type { LiveFeedEntry } from "@/types/app";
import type { MarketSide } from "@/types/db";

const MAX_FEED = 20;

export function useLiveFeed(
  marketId: string | null,
  initial: LiveFeedEntry[],
): LiveFeedEntry[] {
  const [feed, setFeed] = useState<LiveFeedEntry[]>(initial);

  useEffect(() => {
    setFeed(initial);
  }, [initial]);

  useEffect(() => {
    if (!marketId) return;
    const supa = getBrowserSupabase();
    const channel = supa
      .channel(`live_feed:${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "positions",
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            user_id: string;
            side: MarketSide;
            amount: number | string;
            created_at: string;
            funded: boolean;
          };
          if (!row.funded) return;
          const entry: LiveFeedEntry = {
            id: row.id,
            userId: row.user_id,
            username: generateMemeUsername(row.user_id),
            side: row.side,
            amount: Number(row.amount),
            createdAt: row.created_at,
          };
          setFeed((prev) => [entry, ...prev].slice(0, MAX_FEED));
        },
      )
      .subscribe();
    return () => {
      void supa.removeChannel(channel);
    };
  }, [marketId]);

  return feed;
}
