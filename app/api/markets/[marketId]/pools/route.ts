import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/guards";
import { getMarketPools } from "@/lib/services/markets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  try {
    const { marketId } = await params;
    const pools = await getMarketPools(marketId);
    return NextResponse.json(pools);
  } catch (err) {
    return handleApiError(err);
  }
}
