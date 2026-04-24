import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { calculatePayouts, type FundedPosition } from "@/lib/payouts/engine";
import { sendRlusdPayout } from "@/lib/treasury/xrpl";
import { env } from "@/lib/config/env";
import { XRPL_CONFIG } from "@/lib/config/xrpl";
import { AppError } from "@/lib/utils/errors";
import type {
  MarketRow,
  PayoutStatus,
  PositionRow,
  ProfileRow,
} from "@/types/db";

export async function executePayouts(marketId: string): Promise<void> {
  const admin = getAdminSupabase();
  const { data: marketRaw } = await admin
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .maybeSingle();
  const market = marketRaw as MarketRow | null;
  if (!market) throw new AppError("market_not_found", "Market not found", 404);
  if (market.status !== "resolved" && market.status !== "canceled") {
    throw new AppError(
      "market_not_resolved",
      "Market not yet resolved",
      400,
    );
  }

  const { data: positionRows } = await admin
    .from("positions")
    .select("*")
    .eq("market_id", marketId)
    .eq("funded", true);

  const positions = (positionRows ?? []) as PositionRow[];
  const funded: FundedPosition[] = positions.map((p) => ({
    id: p.id,
    userId: p.user_id,
    side: p.side,
    amount: Number(p.amount),
  }));

  const resolutionSide =
    market.status === "canceled" ? "canceled" : market.resolution_side;
  if (!resolutionSide) {
    throw new AppError(
      "no_resolution_side",
      "Market has no resolution side",
      500,
    );
  }

  const { results, totals } = calculatePayouts(
    funded,
    resolutionSide,
    XRPL_CONFIG.PLATFORM_FEE_BPS,
  );

  // Create payout run.
  const { data: runRow, error: runErr } = await admin
    .from("payout_runs")
    .insert({
      market_id: marketId,
      status: "started",
      yes_pool: totals.yesPool,
      no_pool: totals.noPool,
      platform_fee: totals.fee,
    })
    .select("id")
    .single();
  if (runErr || !runRow) {
    throw new AppError(
      "payout_run_insert",
      runErr?.message ?? "insert failed",
      500,
    );
  }
  const runId = (runRow as { id: string }).id;

  try {
    // Insert payout rows.
    const payoutInserts = results
      .filter((r) => r.netAmount > 0 || resolutionSide === "canceled")
      .map((r) => ({
        payout_run_id: runId,
        market_id: marketId,
        user_id: r.userId,
        position_id: r.positionId,
        gross_amount: r.grossAmount,
        fee_amount: r.feeAmount,
        net_amount: r.netAmount,
        status: "ready" as PayoutStatus,
      }));

    if (payoutInserts.length > 0) {
      const { error: payoutsErr } = await admin
        .from("payouts")
        .insert(payoutInserts);
      if (payoutsErr) {
        throw new AppError("payouts_insert", payoutsErr.message, 500);
      }
    }

    // Credit internal balances for winners (always happens).
    for (const r of results) {
      if (r.netAmount <= 0 && resolutionSide !== "canceled") continue;
      const credit = r.netAmount;
      if (credit <= 0) continue;
      const { data: bal } = await admin
        .from("user_balance")
        .select("balance")
        .eq("user_id", r.userId)
        .maybeSingle();
      const prev = Number((bal as { balance?: number } | null)?.balance ?? 0);
      await admin.from("internal_wallet_ledger").insert({
        user_id: r.userId,
        entry_type: resolutionSide === "canceled" ? "refund" : "payout",
        amount: credit,
        reference_type: "payout",
        reference_id: r.positionId,
        balance_after: prev + credit,
      });
    }

    // Optionally dispatch RLUSD on-chain.
    if (env.FEATURE_ENABLE_PAYOUTS && resolutionSide !== "canceled") {
      const winners = results.filter((r) => r.isWinner && r.netAmount > 0);
      for (const r of winners) {
        const { data: profileRaw } = await admin
          .from("profiles")
          .select("xrpl_address")
          .eq("id", r.userId)
          .maybeSingle();
        const profile = profileRaw as Pick<ProfileRow, "xrpl_address"> | null;
        if (!profile?.xrpl_address) continue;
        try {
          const txHash = await sendRlusdPayout(
            profile.xrpl_address,
            r.netAmount,
            r.positionId,
          );
          await admin
            .from("payouts")
            .update({
              status: "processing",
              xrpl_tx_hash: txHash,
              xrpl_tx_status: "submitted",
            })
            .eq("position_id", r.positionId);
        } catch (txErr) {
          // eslint-disable-next-line no-console
          console.error("[payout] xrpl send failed", txErr);
        }
      }
    }

    // Update user stats.
    await updateUserStats(results, resolutionSide);

    // Notify users of results.
    try {
      const { notifyResolutionResults } = await import("@/lib/notifications/resolution-alerts");
      await notifyResolutionResults(
        marketId,
        results.map((r) => ({
          userId: r.userId,
          isWinner: r.isWinner,
          netAmount: r.netAmount,
          stake: r.stake,
        })),
      );
    } catch (notifyErr) {
      // eslint-disable-next-line no-console
      console.error("[payout] notification failed", notifyErr);
    }

    await admin
      .from("payout_runs")
      .update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
  } catch (err) {
    await admin
      .from("payout_runs")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : String(err),
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);
    throw err;
  }
}

async function updateUserStats(
  results: ReturnType<typeof calculatePayouts>["results"],
  resolutionSide: "yes" | "no" | "canceled",
): Promise<void> {
  if (resolutionSide === "canceled") return;
  const admin = getAdminSupabase();
  for (const r of results) {
    const { data: profileRaw } = await admin
      .from("profiles")
      .select(
        "id, total_predictions, total_won, total_earned, win_rate, oracle_title",
      )
      .eq("id", r.userId)
      .maybeSingle();
    const profile = profileRaw as Pick<
      ProfileRow,
      "id" | "total_predictions" | "total_won" | "total_earned" | "win_rate"
    > | null;
    if (!profile) continue;
    const totalPredictions = profile.total_predictions + 1;
    const totalWon = profile.total_won + (r.isWinner ? 1 : 0);
    const winRate =
      totalPredictions > 0
        ? Number(((totalWon / totalPredictions) * 100).toFixed(2))
        : 0;
    const delta = r.isWinner ? r.netAmount - r.stake : -r.stake;
    const totalEarned = Number(profile.total_earned) + delta;
    await admin
      .from("profiles")
      .update({
        total_predictions: totalPredictions,
        total_won: totalWon,
        win_rate: winRate,
        total_earned: totalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);
  }
}
