import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import {
  lockMarketsApproachingEnd,
  resolveDueMarkets,
} from "@/lib/markets/lifecycle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const locked = await lockMarketsApproachingEnd();
    const result = await resolveDueMarkets();
    return NextResponse.json({ ok: true, locked, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
