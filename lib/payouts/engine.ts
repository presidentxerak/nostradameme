import type { MarketSide } from "@/types/db";

export interface FundedPosition {
  id: string;
  userId: string;
  side: MarketSide;
  amount: number;
}

export interface PayoutResult {
  positionId: string;
  userId: string;
  side: MarketSide;
  stake: number;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  isWinner: boolean;
}

export interface PayoutTotals {
  yesPool: number;
  noPool: number;
  totalPool: number;
  winningPool: number;
  losingPool: number;
  fee: number;
  distributable: number;
}

/**
 * Pure, deterministic payout calculation.
 * Zero side effects. Zero DB calls.
 */
export function calculatePayouts(
  positions: FundedPosition[],
  resolutionSide: MarketSide | "canceled",
  platformFeeBps: number,
): { results: PayoutResult[]; totals: PayoutTotals } {
  const yesPool = positions
    .filter((p) => p.side === "yes")
    .reduce((sum, p) => sum + p.amount, 0);
  const noPool = positions
    .filter((p) => p.side === "no")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPool = yesPool + noPool;

  if (resolutionSide === "canceled") {
    const results = positions.map((p) => ({
      positionId: p.id,
      userId: p.userId,
      side: p.side,
      stake: p.amount,
      grossAmount: p.amount,
      feeAmount: 0,
      netAmount: p.amount,
      isWinner: false,
    }));
    return {
      results,
      totals: {
        yesPool,
        noPool,
        totalPool,
        winningPool: 0,
        losingPool: 0,
        fee: 0,
        distributable: totalPool,
      },
    };
  }

  const winningPool = resolutionSide === "yes" ? yesPool : noPool;
  const losingPool = resolutionSide === "yes" ? noPool : yesPool;
  const fee = (totalPool * platformFeeBps) / 10000;
  const distributable = totalPool - fee;

  const results: PayoutResult[] = positions.map((p) => {
    const isWinner = p.side === resolutionSide;
    if (!isWinner || winningPool <= 0) {
      return {
        positionId: p.id,
        userId: p.userId,
        side: p.side,
        stake: p.amount,
        grossAmount: 0,
        feeAmount: 0,
        netAmount: 0,
        isWinner: false,
      };
    }
    const share = p.amount / winningPool;
    const gross = share * distributable;
    const feeShare = share * fee;
    return {
      positionId: p.id,
      userId: p.userId,
      side: p.side,
      stake: p.amount,
      grossAmount: gross + feeShare,
      feeAmount: feeShare,
      netAmount: gross,
      isWinner: true,
    };
  });

  return {
    results,
    totals: {
      yesPool,
      noPool,
      totalPool,
      winningPool,
      losingPool,
      fee,
      distributable,
    },
  };
}
