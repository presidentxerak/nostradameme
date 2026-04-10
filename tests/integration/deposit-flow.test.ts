import { describe, it, expect } from "vitest";
import { matchDeposit } from "@/lib/treasury/deposit-matcher";
import type { DepositIntentRow } from "@/types/db";
import type { IncomingPayment } from "@/lib/treasury/xrpl";

/**
 * Integration-style test that exercises the matcher end-to-end
 * with a realistic bundle of intents + incoming payments.
 */
describe("deposit flow matching", () => {
  it("handles mixed memo + amount matches", () => {
    const now = new Date();
    const intents: DepositIntentRow[] = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        user_id: "u1",
        display_amount_usd: 50,
        rlusd_amount: 50,
        status: "pending",
        transak_order_id: null,
        xrpl_tx_hash: null,
        xrpl_ledger_index: null,
        credited_at: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        user_id: "u2",
        display_amount_usd: 25,
        rlusd_amount: 25,
        status: "pending",
        transak_order_id: null,
        xrpl_tx_hash: null,
        xrpl_ledger_index: null,
        credited_at: null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
    ];

    const payments: IncomingPayment[] = [
      {
        txHash: "TX1",
        from: "rX",
        amount: 50,
        currency: "RLUSD",
        memo: "11111111-1111-1111-1111-111111111111",
        ledgerIndex: 1,
        timestamp: now.toISOString(),
      },
      {
        txHash: "TX2",
        from: "rY",
        amount: 25,
        currency: "RLUSD",
        memo: null,
        ledgerIndex: 2,
        timestamp: now.toISOString(),
      },
    ];

    const first = matchDeposit(payments[0]!, intents);
    const second = matchDeposit(payments[1]!, intents);

    expect(first?.strategy).toBe("memo");
    expect(first?.intent.id).toBe("11111111-1111-1111-1111-111111111111");
    expect(second?.strategy).toBe("amount_window");
    expect(second?.intent.id).toBe("22222222-2222-2222-2222-222222222222");
  });
});
