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
  xrpAmount: z.number().positive().max(100000),
  xrpAddress: z.string().min(25).max(50).startsWith("r"),
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

    const { data: recentCount } = await admin
      .from("xrp_deposit_intents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profileId)
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
    if ((recentCount as unknown as number) >= 3) {
      throw new AppError("too_many_pending", "Too many pending deposits. Wait for confirmation.", 429);
    }

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
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !intentRaw) {
      throw new AppError("intent_insert_failed", error?.message ?? "Failed", 500);
    }

    return NextResponse.json({
      ok: true,
      intentId: (intentRaw as { id: string }).id,
      usdEstimate: usdAmount,
      message: "Deposit registered. Your balance will update once the payment is confirmed on-chain (usually under 1 minute).",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
