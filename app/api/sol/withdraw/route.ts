import { NextResponse } from "next/server";
import { z } from "zod";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { handleApiError } from "@/lib/auth/guards";
import { verifyPrivyAccessToken } from "@/lib/privy/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendSol } from "@/lib/solana/client";
import { getSpotPrice } from "@/lib/coingecko/service";
import { getUserBalance } from "@/lib/services/positions";
import { AppError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  usdAmount: z.number().positive().min(1),
  solanaAddress: z.string().min(20),
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
      .select("id")
      .eq("privy_user_id", verified.userId)
      .maybeSingle();
    if (!profileRaw) {
      throw new AppError("no_profile", "Profile not found", 404);
    }
    const userId = (profileRaw as { id: string }).id;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const { usdAmount, solanaAddress } = parsed.data;

    const balance = await getUserBalance(userId);
    if (balance < usdAmount) {
      throw new AppError("insufficient_balance", "Not enough balance", 402);
    }

    const solPrice = await getSpotPrice("solana");
    if (!solPrice || solPrice <= 0) {
      throw new AppError("no_sol_price", "Could not fetch SOL price", 502);
    }

    const solAmount = usdAmount / solPrice;
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);
    if (lamports <= 0) {
      throw new AppError("bad_amount", "Amount too small", 400);
    }

    const signature = await sendSol(solanaAddress, lamports);

    const newBalance = balance - usdAmount;
    await admin.from("internal_wallet_ledger").insert({
      user_id: userId,
      entry_type: "sol_withdraw",
      amount: -usdAmount,
      reference_type: "sol_withdraw",
      reference_id: null,
      balance_after: newBalance,
    });

    return NextResponse.json({
      signature,
      solAmount: solAmount.toFixed(6),
      usdAmount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
