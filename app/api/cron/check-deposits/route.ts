import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { reconcileDeposits } from "@/lib/treasury/reconciliation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const result = await reconcileDeposits();
    return NextResponse.json({
      ok: true,
      ...result,
      unmatchedCount: result.unmatched.length,
      unmatched: undefined,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
