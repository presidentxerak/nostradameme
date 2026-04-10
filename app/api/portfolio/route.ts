import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/auth/guards";
import { getUserHistory } from "@/lib/services/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const limit = Math.min(100, Number(url.searchParams.get("limit") ?? 50));
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
    const entries = await getUserHistory(user.id, limit, offset);
    return NextResponse.json({ entries });
  } catch (err) {
    return handleApiError(err);
  }
}
