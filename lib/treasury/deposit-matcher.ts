import "server-only";

import type { DepositIntentRow } from "@/types/db";
import type { IncomingPayment } from "@/lib/treasury/xrpl";

const AMOUNT_TOLERANCE = 0.01;
const WINDOW_MS = 30 * 60 * 1000;

export interface MatchResult {
  intent: DepositIntentRow;
  strategy: "memo" | "amount_window";
}

export function matchDeposit(
  incoming: IncomingPayment,
  pendingIntents: DepositIntentRow[],
): MatchResult | null {
  if (incoming.memo) {
    const byMemo = pendingIntents.find((i) => i.id === incoming.memo);
    if (byMemo) return { intent: byMemo, strategy: "memo" };
  }
  const incomingTs = new Date(incoming.timestamp).getTime();
  const windowMatches = pendingIntents.filter((i) => {
    const created = new Date(i.created_at).getTime();
    const withinWindow = Math.abs(incomingTs - created) <= WINDOW_MS;
    const amtClose =
      Math.abs(Number(i.rlusd_amount) - incoming.amount) <= AMOUNT_TOLERANCE;
    return withinWindow && amtClose && i.status === "pending";
  });
  if (windowMatches.length === 1) {
    return { intent: windowMatches[0]!, strategy: "amount_window" };
  }
  return null;
}
