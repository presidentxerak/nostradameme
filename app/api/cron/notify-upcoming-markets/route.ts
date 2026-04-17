import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { notifyUpcomingMarkets } from "@/lib/notifications/market-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const result = await notifyUpcomingMarkets();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
