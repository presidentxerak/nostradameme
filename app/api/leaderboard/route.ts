import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { getLeaderboardSnapshot } from "@/lib/leaderboard/compute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const periodRaw = url.searchParams.get("period") ?? "all_time";
    const period =
      periodRaw === "weekly" || periodRaw === "daily" ? periodRaw : "all_time";
    const user = await getSessionUser();
    const result = await getLeaderboardSnapshot(period, user?.id);
    return NextResponse.json({
      period,
      entries: result.entries,
      currentUserEntry: result.currentUserEntry,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
