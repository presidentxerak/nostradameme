import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { generateHourlyMarket } from "@/lib/markets/generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const result = await generateHourlyMarket("cron-hourly");
    return NextResponse.json({ ok: true, market: result });
  } catch (err) {
    const isAlreadyExists =
      err instanceof Error && err.message.includes("already exists");
    if (isAlreadyExists) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    return handleApiError(err);
  }
}

export const GET = POST;
