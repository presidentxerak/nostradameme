import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import {
  lockMarketsApproachingEnd,
  resolveDueMarkets,
} from "@/lib/markets/lifecycle";
import { generateHourlyMarket } from "@/lib/markets/generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const locked = await lockMarketsApproachingEnd();
    const result = await resolveDueMarkets();

    // Always ensure a new market exists for the current hour.
    let newMarket = false;
    try {
      await generateHourlyMarket("cron-resolve-auto");
      newMarket = true;
    } catch {
      // Already exists or CoinGecko unavailable.
    }

    return NextResponse.json({ ok: true, locked, newMarket, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}
