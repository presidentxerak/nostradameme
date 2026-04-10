import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireUser } from "@/lib/auth/guards";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getUserBalance } from "@/lib/services/positions";
import { resolveUsername } from "@/lib/utils/meme-names";
import { AppError } from "@/lib/utils/errors";
import type { ProfileRow } from "@/types/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  username: z
    .string()
    .trim()
    .max(24)
    .regex(/^[A-Za-z0-9_]*$/, "letters, numbers, underscore only")
    .optional(),
  notifyOnResolution: z.boolean().optional(),
  notifyOnNewMarket: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const admin = getAdminSupabase();
    const { data } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    const profile = data as ProfileRow | null;
    if (!profile) {
      return NextResponse.json({
        id: user.id,
        email: user.email,
        username: null,
        balance: 0,
        profile: null,
      });
    }
    const balance = await getUserBalance(user.id);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: resolveUsername(user.id, profile.username),
      balance,
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        winRate: Number(profile.win_rate),
        totalPredictions: profile.total_predictions,
        totalEarned: Number(profile.total_earned),
        oracleTitle: profile.oracle_title,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const parsed = PatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const admin = getAdminSupabase();
    const { username, notifyOnResolution, notifyOnNewMarket } = parsed.data;
    if (typeof username === "string") {
      const cleaned = username.length > 0 ? username : null;
      await admin
        .from("profiles")
        .update({
          username: cleaned,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }
    if (
      typeof notifyOnResolution === "boolean" ||
      typeof notifyOnNewMarket === "boolean"
    ) {
      const patch: Record<string, unknown> = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };
      if (typeof notifyOnResolution === "boolean")
        patch.notify_on_resolution = notifyOnResolution;
      if (typeof notifyOnNewMarket === "boolean")
        patch.notify_on_new_market = notifyOnNewMarket;
      await admin.from("user_settings").upsert(patch);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
