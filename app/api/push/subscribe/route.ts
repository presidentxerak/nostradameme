import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requirePrivyUser } from "@/lib/auth/guards";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { AppError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const user = await requirePrivyUser(req);
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const { endpoint, keys, userAgent } = parsed.data;
    const admin = getAdminSupabase();

    // Upsert by endpoint — a device can re-subscribe safely.
    await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: userAgent ?? null,
          failure_count: 0,
        },
        { onConflict: "endpoint" },
      );

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
