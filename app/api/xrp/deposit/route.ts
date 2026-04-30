import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/auth/guards";
import { enforceRateLimit } from "@/lib/auth/rate-limit";
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
      .select("id, xrpl_address")
      .eq("privy_user_id", verified.userId)
      .maybeSingle();
    if (!profileRaw) {
      throw new AppError("no_profile", "Profile not found", 404);
    }
    const profile = profileRaw as { id: string; xrpl_address: string | null };
    const profileId = profile.id;

    await enforceRateLimit({
      key: `xrp:deposit:user:${profileId}`,
      max: 10,
      windowSeconds: 60,
    });

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const { xrpAmount, xrpAddress } = parsed.data;

    // Reject claims for an address already linked to another profile.
    const { data: claimedRaw } = await admin
      .from("profiles")
      .select("id")
      .eq("xrpl_address", xrpAddress)
      .neq("id", profileId)
      .maybeSingle();
    if (claimedRaw) {
      throw new AppError(
        "address_already_linked",
        "This XRPL address is already linked to another account",
        409,
      );
    }

    // If profile already has a linked XRPL address, reject mismatched senders.
    if (profile.xrpl_address && profile.xrpl_address !== xrpAddress) {
      throw new AppError(
        "address_mismatch",
        "Deposit must come from your linked XRPL address",
        403,
      );
    }

    // Per-user rate limit: max 3 pending deposits in the last 10 minutes.
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: pendingCount } = await admin
      .from("xrp_deposit_intents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profileId)
      .eq("status", "pending")
      .gte("created_at", since);
    if ((pendingCount ?? 0) >= 3) {
      throw new AppError(
        "too_many_pending",
        "Too many pending deposits. Wait for confirmation.",
        429,
      );
    }

    const xrpPrice = (await getSpotPrice("ripple")) ?? 0;
    const usdAmount = xrpAmount * xrpPrice;

    // Lock the address on first deposit (atomic on null → only first wins).
    if (!profile.xrpl_address) {
      await admin
        .from("profiles")
        .update({
          xrpl_address: xrpAddress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId)
        .is("xrpl_address", null);
    }

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
      message:
        "Deposit registered. Your balance will update once the payment is confirmed on-chain (usually under 1 minute).",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
