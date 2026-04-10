import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { generateMarketForSlot } from "@/lib/markets/generator";
import { marketAlreadyExistsForSlot } from "@/lib/markets/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    if (await marketAlreadyExistsForSlot("weekly")) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    const result = await generateMarketForSlot("weekly", "cron");
    return NextResponse.json({ ok: true, market: result });
  } catch (err) {
    return handleApiError(err);
  }
}
