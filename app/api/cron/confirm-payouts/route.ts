import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getTransactionStatus } from "@/lib/treasury/xrpl";
import { env } from "@/lib/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PayoutRow {
  id: string;
  xrpl_tx_hash: string | null;
  status: string;
  xrpl_tx_status: string | null;
}

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const admin = getAdminSupabase();

    const { data } = await admin
      .from("payouts")
      .select("id, xrpl_tx_hash, status, xrpl_tx_status")
      .eq("status", "processing")
      .eq("xrpl_tx_status", "submitted")
      .limit(100);

    const rows = (data ?? []) as PayoutRow[];
    let confirmed = 0;
    let failed = 0;
    let stillPending = 0;

    for (const row of rows) {
      // In play-money mode (payouts disabled) we never have real on-chain
      // hashes; mark as paid so the user-facing flow completes.
      if (!env.FEATURE_ENABLE_PAYOUTS || !row.xrpl_tx_hash) {
        await admin
          .from("payouts")
          .update({
            status: "paid",
            xrpl_tx_status: "confirmed",
            paid_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        confirmed++;
        continue;
      }

      const tx = await getTransactionStatus(row.xrpl_tx_hash);
      if (tx.status === "pending") {
        stillPending++;
        continue;
      }
      if (tx.status === "not_found") {
        // Tx never made it on-chain — flag as failed so it can be retried.
        await admin
          .from("payouts")
          .update({
            status: "failed",
            xrpl_tx_status: "not_found",
            error_message: "Transaction not found on ledger",
          })
          .eq("id", row.id);
        failed++;
        continue;
      }
      if (tx.success) {
        await admin
          .from("payouts")
          .update({
            status: "paid",
            xrpl_tx_status: "confirmed",
            paid_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        confirmed++;
      } else {
        await admin
          .from("payouts")
          .update({
            status: "failed",
            xrpl_tx_status: tx.resultCode,
            error_message: `Ledger rejected: ${tx.resultCode}`,
          })
          .eq("id", row.id);
        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      checked: rows.length,
      confirmed,
      failed,
      pending: stillPending,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export const GET = POST;
