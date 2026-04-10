import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/guards";
import { getOpenMarketsBySlot, getMarketPools } from "@/lib/services/markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slots = await getOpenMarketsBySlot();
    const keys = ["morning", "noon", "night"] as const;
    const entries = await Promise.all(
      keys.map(async (slot) => {
        const market = slots[slot];
        if (!market) return [slot, null] as const;
        const pools = await getMarketPools(market.id);
        return [
          slot,
          {
            ...market,
            pools,
          },
        ] as const;
      }),
    );
    const result = Object.fromEntries(entries);
    return NextResponse.json({ markets: result });
  } catch (err) {
    return handleApiError(err);
  }
}
