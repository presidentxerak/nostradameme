import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/auth/guards";
import { verifyPrivyAccessToken } from "@/lib/privy/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";
import { getSpotPrice } from "@/lib/coingecko/service";
import { verifyTransaction } from "@/lib/solana/client";
import { SOLANA_CONFIG } from "@/lib/solana/config";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  txSignature: z.string().min(20).max(120),
  solAmount: z.number().positive().max(1000),
  solAddress: z.string().min(20).max(60),
});

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const verified = token ? await verifyPrivyAccessToken(token) : null;
    if (!verified) {
      throw new AppError("not_authed", "Not authenticated", 401);
    }
    const admin = getAdminSupabase();
    const { data: profileRaw } = await admin
      .from("profiles")
      .select("id, solana_address")
      .eq("privy_user_id", verified.userId)
      .maybeSingle();
    if (!profileRaw) {
      throw new AppError("no_profile", "Profile not found", 404);
    }
    const profile = profileRaw as { id: string; solana_address: string | null };
    const profileId = profile.id;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const { txSignature, solAmount, solAddress } = parsed.data;

    // Ownership check: prevent another profile from claiming a deposit that
    // originated from a wallet already linked to a different account.
    const { data: claimedRaw } = await admin
      .from("profiles")
      .select("id")
      .eq("solana_address", solAddress)
      .neq("id", profileId)
      .maybeSingle();
    if (claimedRaw) {
      throw new AppError(
        "address_already_linked",
        "This Solana wallet is already linked to another account",
        409,
      );
    }

    // If the profile already has a linked Solana address, the deposit must
    // come from that exact address. This prevents an attacker from racing
    // a legitimate user's incoming tx with their own profile.
    if (profile.solana_address && profile.solana_address !== solAddress) {
      throw new AppError(
        "address_mismatch",
        "Deposit must come from your linked Solana wallet",
        403,
      );
    }

    const { data: existing } = await admin
      .from("sol_deposit_intents")
      .select("id")
      .eq("tx_signature", txSignature)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    if (!SOLANA_CONFIG.treasuryAddress) {
      throw new AppError("config_error", "Treasury not configured", 500);
    }

    const minLamports = Math.floor(solAmount * LAMPORTS_PER_SOL * 0.95);
    const { confirmed, lamports } = await verifyTransaction(
      txSignature,
      solAddress,
      SOLANA_CONFIG.treasuryAddress,
      minLamports,
    );
    if (!confirmed) {
      throw new AppError("tx_not_confirmed", "Transaction not verified on-chain. Please wait and retry.", 400);
    }

    const verifiedSol = lamports / LAMPORTS_PER_SOL;
    const solPrice = (await getSpotPrice("solana")) ?? 0;
    const usdAmount = verifiedSol * solPrice;

    // Lock the sender address to this profile on first successful deposit.
    if (!profile.solana_address) {
      await admin
        .from("profiles")
        .update({ solana_address: solAddress, updated_at: new Date().toISOString() })
        .eq("id", profileId);
    }

    await admin.from("sol_deposit_intents").insert({
      user_id: profileId,
      solana_address: solAddress,
      expected_sol: verifiedSol,
      sol_price_usd: solPrice,
      usd_amount: usdAmount,
      tx_signature: txSignature,
      status: "confirmed",
      credited_at: new Date().toISOString(),
    });

    const { data: balRow } = await admin
      .from("user_balance")
      .select("balance")
      .eq("user_id", profileId)
      .maybeSingle();
    const prevBalance = Number((balRow as { balance?: number } | null)?.balance ?? 0);

    await admin.from("internal_wallet_ledger").insert({
      user_id: profileId,
      entry_type: "sol_deposit",
      amount: usdAmount,
      reference_type: "sol_deposit_intent",
      reference_id: txSignature,
      balance_after: prevBalance + usdAmount,
    });

    return NextResponse.json({
      ok: true,
      intentId: txSignature,
      credited: true,
      usdAmount,
      newBalance: prevBalance + usdAmount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
