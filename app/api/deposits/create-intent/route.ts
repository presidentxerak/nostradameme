import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireUser } from "@/lib/auth/guards";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  buildTransakWidgetUrl,
  validateDepositAmount,
} from "@/lib/onramp/transak";
import { createUserXrplWallet } from "@/lib/privy/server";
import { AppError } from "@/lib/utils/errors";
import type { ProfileRow } from "@/types/db";
import { env } from "@/lib/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  amountUsd: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const amount = parsed.data.amountUsd;
    try {
      validateDepositAmount(amount);
    } catch (err) {
      throw new AppError(
        "bad_amount",
        err instanceof Error ? err.message : "Bad amount",
        400,
      );
    }

    if (!env.FEATURE_ENABLE_ONRAMP) {
      throw new AppError(
        "onramp_disabled",
        "Add Funds is temporarily unavailable",
        503,
      );
    }

    const admin = getAdminSupabase();
    const { data: profileRaw } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const profile = profileRaw as ProfileRow | null;
    if (!profile) {
      throw new AppError("no_profile", "Profile not found", 404);
    }

    let address = profile.xrpl_address;
    if (!address) {
      if (!profile.privy_user_id) {
        throw new AppError(
          "no_privy",
          "Account not fully set up. Please sign in again.",
          400,
        );
      }
      const { address: created } = await createUserXrplWallet(
        profile.privy_user_id,
      );
      address = created;
      await admin
        .from("profiles")
        .update({
          xrpl_address: created,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    const { data: intentRaw, error } = await admin
      .from("deposit_intents")
      .insert({
        user_id: user.id,
        display_amount_usd: amount,
        rlusd_amount: amount,
        status: "pending",
      })
      .select("id")
      .single();
    if (error || !intentRaw) {
      throw new AppError(
        "intent_insert_failed",
        error?.message ?? "Failed",
        500,
      );
    }
    const intentId = (intentRaw as { id: string }).id;

    const widgetUrl = buildTransakWidgetUrl({
      walletAddress: address,
      fiatAmount: amount,
      partnerOrderId: intentId,
      email: user.email,
    });

    return NextResponse.json({
      intentId,
      widgetUrl,
      displayAmountUsd: amount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
