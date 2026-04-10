import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAdmin } from "@/lib/auth/guards";
import { resolveMarket } from "@/lib/markets/resolver";
import { executePayouts } from "@/lib/payouts/executor";
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
    const resolution = await resolveMarket(parsed.data.marketId);
    await executePayouts(parsed.data.marketId);
    await logAdminAction({
      adminId: admin.id,
      action: "resolve_market",
      entityType: "market",
      entityId: parsed.data.marketId,
      details: { resolution },
    });
    return NextResponse.json({ ok: true, resolution });
  } catch (err) {
    return handleApiError(err);
  }
}
