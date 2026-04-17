import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireUser } from "@/lib/auth/guards";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const admin = getAdminSupabase();
    await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", parsed.data.endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
