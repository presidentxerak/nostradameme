"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";

interface LedgerRow {
  user_id: string;
  balance_after: number | string;
}

export function useBalance(
  userId: string | null,
  initial: number,
): number {
  const [balance, setBalance] = useState<number>(initial);

  useEffect(() => {
    setBalance(initial);
  }, [initial]);

  useEffect(() => {
    if (!userId) return;
    const supa = getBrowserSupabase();
    const channel = supa
      .channel(`balance:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "internal_wallet_ledger",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as LedgerRow;
          setBalance(Number(row.balance_after));
        },
      )
      .subscribe();
    return () => {
      void supa.removeChannel(channel);
    };
  }, [userId]);

  return balance;
}
