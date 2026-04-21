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
  xrpAmount: z.number().positive(),
  xrpAddress: z.string().min(20).startsWith("r"),
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
    const { xrpAmount, xrpAddress } = parsed.data;

    const xrpPrice = (await getSpotPrice("ripple")) ?? 0;
    const usdAmount = xrpAmount * xrpPrice;

    await admin
      .from("profiles")
      .update({ xrpl_address: xrpAddress, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    const { data: intentRaw, error } = await admin
      .from("xrp_deposit_intents")
      .insert({
        user_id: profileId,
        xrp_address: xrpAddress,
        expected_xrp: xrpAmount,
        xrp_price_usd: xrpPrice,
        usd_amount: usdAmount,
        status: "confirmed",
        credited_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !intentRaw) {
      throw new AppError(
        "intent_insert_failed",
        error?.message ?? "Failed to create deposit intent",
        500,
      );
    }

    const intentId = (intentRaw as { id: string }).id;

    const { data: balRow } = await admin
      .from("user_balance")
      .select("balance")
      .eq("user_id", profileId)
      .maybeSingle();
    const prevBalance = Number((balRow as { balance?: number } | null)?.balance ?? 0);

    await admin.from("internal_wallet_ledger").insert({
      user_id: profileId,
      entry_type: "xrp_deposit",
      amount: usdAmount,
      reference_type: "xrp_deposit_intent",
      reference_id: intentId,
      balance_after: prevBalance + usdAmount,
    });

    return NextResponse.json({
      ok: true,
      intentId,
      credited: true,
      usdAmount,
      newBalance: prevBalance + usdAmount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
