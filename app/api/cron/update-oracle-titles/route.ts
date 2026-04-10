import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { updateAllOracleTitles } from "@/lib/leaderboard/compute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const updated = await updateAllOracleTitles();
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    return handleApiError(err);
  }
}
