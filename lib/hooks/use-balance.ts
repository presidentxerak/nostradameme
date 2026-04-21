"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setBalance(initial);
  }, [initial]);

  const pollBalance = useCallback(() => {
    if (!userId) return;
    const supa = getBrowserSupabase();
    supa
      .from("user_balance")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const newBal = Number((data as { balance?: number }).balance ?? 0);
          setBalance(newBal);
        }
      });
  }, [userId]);

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

    // Poll every 10s as fallback in case Realtime isn't configured
    pollRef.current = setInterval(pollBalance, 10000);

    return () => {
      void supa.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId, pollBalance]);

  return balance;
}
