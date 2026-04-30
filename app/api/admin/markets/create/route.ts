import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAdminFromRequest } from "@/lib/auth/guards";
import { generateMarketForSlot } from "@/lib/markets/generator";
import { AppError } from "@/lib/utils/errors";
import { logAdminAction } from "@/lib/audit/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  slot: z.enum(["morning", "noon", "night", "weekly"]),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdminFromRequest(req);
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const result = await generateMarketForSlot(parsed.data.slot);
    await logAdminAction({
      adminId: admin.id,
      action: "create_market",
      entityType: "market",
      details: { slot: parsed.data.slot },
    });
    return NextResponse.json({ ok: true, market: result });
  } catch (err) {
    return handleApiError(err);
  }
}
