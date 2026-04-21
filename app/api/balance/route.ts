import { NextResponse } from "next/server";
import { handleApiError, requirePrivyUser } from "@/lib/auth/guards";
import { getUserBalance } from "@/lib/services/positions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requirePrivyUser(req);
    const balance = await getUserBalance(user.id);
    return NextResponse.json({ balance });
  } catch (err) {
    return handleApiError(err);
  }
}
