import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/guards";
import { getMarketById, getMarketPools } from "@/lib/services/markets";
import { AppError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  try {
    const { marketId } = await params;
    const market = await getMarketById(marketId);
    if (!market) throw new AppError("not_found", "Market not found", 404);
    const pools = await getMarketPools(marketId);
    return NextResponse.json({ market, pools });
  } catch (err) {
    return handleApiError(err);
  }
}
