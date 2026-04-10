"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { MarketSide, MarketStatus } from "@/types/db";

export interface MarketResolutionEvent {
  resolved: boolean;
  resolutionSide: MarketSide | null;
  closingPrice: number | null;
  status: MarketStatus;
}

export function useMarketResolution(
  marketId: string | null,
  initialStatus: MarketStatus,
  initialSide: MarketSide | null,
  initialClosing: number | null,
): MarketResolutionEvent {
  const [state, setState] = useState<MarketResolutionEvent>({
    resolved: initialStatus === "resolved",
    resolutionSide: initialSide,
    closingPrice: initialClosing,
    status: initialStatus,
  });

  useEffect(() => {
    if (!marketId) return;
    const supa = getBrowserSupabase();
    const channel = supa
      .channel(`market_resolution:${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "markets",
          filter: `id=eq.${marketId}`,
        },
        (payload) => {
          const row = payload.new as {
            status: MarketStatus;
            resolution_side: MarketSide | null;
            closing_price: number | string | null;
          };
          setState({
            resolved: row.status === "resolved",
            resolutionSide: row.resolution_side,
            closingPrice:
              row.closing_price !== null ? Number(row.closing_price) : null,
            status: row.status,
          });
        },
      )
      .subscribe();
    return () => {
      void supa.removeChannel(channel);
    };
  }, [marketId]);

  return state;
}
