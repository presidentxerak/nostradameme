import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { detectSolDeposits } from "@/lib/solana/deposit-detector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const result = await detectSolDeposits();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleApiError(err);
  }
}

export const GET = POST;
