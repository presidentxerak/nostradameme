import { describe, expect, it } from "vitest";
import { matchDeposit } from "@/lib/treasury/deposit-matcher";
import type { DepositIntentRow } from "@/types/db";
import type { IncomingPayment } from "@/lib/treasury/xrpl";

function intent(
  overrides: Partial<DepositIntentRow> = {},
): DepositIntentRow {
  return {
    id: "intent-1",
    user_id: "user-1",
    display_amount_usd: 25,
    rlusd_amount: 25,
    status: "pending",
    transak_order_id: null,
    xrpl_tx_hash: null,
    xrpl_ledger_index: null,
    credited_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function payment(
  overrides: Partial<IncomingPayment> = {},
): IncomingPayment {
  return {
    txHash: "TXHASH",
    from: "rFromAddr",
    amount: 25,
    currency: "RLUSD",
    memo: null,
    ledgerIndex: 123,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

describe("matchDeposit", () => {
  it("matches by memo first", () => {
    const i = intent({ id: "abc-123" });
    const p = payment({ memo: "abc-123" });
    const r = matchDeposit(p, [i]);
    expect(r?.strategy).toBe("memo");
    expect(r?.intent.id).toBe("abc-123");
  });

  it("matches by amount + time window if exactly one candidate", () => {
    const i = intent({ rlusd_amount: 50 });
    const p = payment({ amount: 50.0 });
    const r = matchDeposit(p, [i]);
    expect(r?.strategy).toBe("amount_window");
  });

  it("does not match when multiple amount candidates exist", () => {
    const i1 = intent({ id: "a", rlusd_amount: 50 });
    const i2 = intent({ id: "b", rlusd_amount: 50 });
    const p = payment({ amount: 50 });
    expect(matchDeposit(p, [i1, i2])).toBeNull();
  });

  it("returns null on total mismatch", () => {
    const i = intent({ rlusd_amount: 1 });
    const p = payment({ amount: 999 });
    expect(matchDeposit(p, [i])).toBeNull();
  });
});
