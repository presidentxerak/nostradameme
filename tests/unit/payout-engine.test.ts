import { describe, expect, it } from "vitest";
import {
  calculatePayouts,
  type FundedPosition,
} from "@/lib/payouts/engine";

const positions: FundedPosition[] = [
  { id: "p1", userId: "u1", side: "yes", amount: 100 },
  { id: "p2", userId: "u2", side: "yes", amount: 100 },
  { id: "p3", userId: "u3", side: "no", amount: 200 },
];

describe("calculatePayouts", () => {
  it("splits winnings proportionally after fee", () => {
    const { results, totals } = calculatePayouts(positions, "yes", 500);
    // totalPool 400, fee 20, distributable 380
    expect(totals.totalPool).toBe(400);
    expect(totals.fee).toBe(20);
    const winners = results.filter((r) => r.isWinner);
    expect(winners).toHaveLength(2);
    // Each yes winner staked 100 of 200 winning pool → 190 net each
    for (const w of winners) {
      expect(w.netAmount).toBeCloseTo(190, 5);
    }
    // NO side: no payout
    const losers = results.filter((r) => !r.isWinner);
    expect(losers.every((l) => l.netAmount === 0)).toBe(true);
  });

  it("cancels fully refund all positions", () => {
    const { results, totals } = calculatePayouts(
      positions,
      "canceled",
      500,
    );
    expect(totals.fee).toBe(0);
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(r.netAmount).toBeCloseTo(r.stake, 5);
    }
  });

  it("handles zero winning pool gracefully", () => {
    const onlyNo: FundedPosition[] = [
      { id: "p", userId: "u", side: "no", amount: 50 },
    ];
    const { results } = calculatePayouts(onlyNo, "yes", 500);
    expect(results[0]?.netAmount).toBe(0);
    expect(results[0]?.isWinner).toBe(false);
  });

  it("is deterministic (pure)", () => {
    const a = calculatePayouts(positions, "yes", 500);
    const b = calculatePayouts(positions, "yes", 500);
    expect(a).toEqual(b);
  });
});
