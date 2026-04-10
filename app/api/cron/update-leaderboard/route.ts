import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { snapshotLeaderboard } from "@/lib/leaderboard/compute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const allTime = await snapshotLeaderboard("all_time");
    const weekly = await snapshotLeaderboard("weekly");
    const daily = await snapshotLeaderboard("daily");
    return NextResponse.json({
      ok: true,
      counts: { allTime, weekly, daily },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
