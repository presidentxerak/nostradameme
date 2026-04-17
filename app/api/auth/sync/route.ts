import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/guards";
import { verifyPrivyAccessToken } from "@/lib/privy/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";
import type { ProfileRow } from "@/types/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      throw new AppError("no_token", "Missing authorization header", 401);
    }
    const verified = await verifyPrivyAccessToken(token);
    if (!verified) {
      throw new AppError("invalid_token", "Invalid Privy token", 401);
    }
    const privyUserId = verified.userId;
    const admin = getAdminSupabase();

    // Check if profile already exists for this Privy user.
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("privy_user_id", privyUserId)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        ok: true,
        profileId: (existing as { id: string }).id,
      });
    }

    // Create a new profile keyed by Privy user ID.
    // We use the Privy user ID as the profile ID since there's no Supabase auth user.
    const profileId = crypto.randomUUID();
    const { data: inserted, error } = await admin
      .from("profiles")
      .insert({
        id: profileId,
        privy_user_id: privyUserId,
        role: "player",
      })
      .select("id")
      .single();
    if (error) {
      // May fail if privy_user_id unique constraint is hit (race condition).
      const { data: retry } = await admin
        .from("profiles")
        .select("id")
        .eq("privy_user_id", privyUserId)
        .maybeSingle();
      if (retry) {
        return NextResponse.json({
          ok: true,
          profileId: (retry as { id: string }).id,
        });
      }
      throw new AppError("sync_failed", error.message, 500);
    }

    // Create default user_settings.
    await admin
      .from("user_settings")
      .insert({ user_id: profileId })
      .select("user_id");

    return NextResponse.json({
      ok: true,
      profileId: (inserted as { id: string }).id,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
