"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { MarketPools } from "@/types/app";
import { calculatePct } from "@/lib/utils/currency";

interface PositionEvent {
  market_id: string;
  side: "yes" | "no";
  amount: number | string;
  funded: boolean;
  created_at: string;
}

export function useMarketPools(
  marketId: string | null,
  initial: MarketPools | null,
): MarketPools | null {
  const [pools, setPools] = useState<MarketPools | null>(initial);

  useEffect(() => {
    setPools(initial);
  }, [initial]);

  useEffect(() => {
    if (!marketId) return;
    const supa = getBrowserSupabase();
    const channel = supa
      .channel(`market_pools:${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "positions",
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          const row = payload.new as PositionEvent;
          if (!row.funded) return;
          setPools((prev) => {
            const base =
              prev ??
              ({
                marketId,
                yesPool: 0,
                noPool: 0,
                totalVolume: 0,
                yesPct: 50,
                noPct: 50,
                lastBetAt: null,
              } satisfies MarketPools);
            const amt = Number(row.amount);
            const yes = base.yesPool + (row.side === "yes" ? amt : 0);
            const no = base.noPool + (row.side === "no" ? amt : 0);
            const total = yes + no;
            return {
              marketId,
              yesPool: yes,
              noPool: no,
              totalVolume: total,
              yesPct: calculatePct(yes, total || 1),
              noPct: calculatePct(no, total || 1),
              lastBetAt: row.created_at,
            };
          });
        },
      )
      .subscribe();
    return () => {
      void supa.removeChannel(channel);
    };
  }, [marketId]);

  return pools;
}
