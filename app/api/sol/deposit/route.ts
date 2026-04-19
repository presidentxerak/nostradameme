import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/auth/guards";
import { verifyPrivyAccessToken } from "@/lib/privy/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";
import { getSpotPrice } from "@/lib/coingecko/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  txSignature: z.string().min(10),
  solAmount: z.number().positive(),
  solAddress: z.string().min(20),
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
    const profileId = (profileRaw as { id: string }).id;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const { txSignature, solAmount, solAddress } = parsed.data;

    // Dedupe check.
    const { data: existing } = await admin
      .from("sol_deposit_intents")
      .select("id")
      .eq("tx_signature", txSignature)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const solPrice = (await getSpotPrice("solana")) ?? 0;
    const usdAmount = solAmount * solPrice;

    // Save the solana_address on the profile.
    await admin
      .from("profiles")
      .update({ solana_address: solAddress, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    await admin.from("sol_deposit_intents").insert({
      user_id: profileId,
      solana_address: solAddress,
      expected_sol: solAmount,
      sol_price_usd: solPrice,
      usd_amount: usdAmount,
      tx_signature: txSignature,
      status: "pending",
    });

    return NextResponse.json({ ok: true, intentId: txSignature });
  } catch (err) {
    return handleApiError(err);
  }
}
