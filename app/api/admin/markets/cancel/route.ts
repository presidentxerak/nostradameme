import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAdmin } from "@/lib/auth/guards";
import { cancelMarket } from "@/lib/markets/lifecycle";
import { AppError } from "@/lib/utils/errors";
import { logAdminAction } from "@/lib/audit/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  marketId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    await cancelMarket(parsed.data.marketId);
    await logAdminAction({
      adminId: admin.id,
      action: "cancel_market",
      entityType: "market",
      entityId: parsed.data.marketId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
