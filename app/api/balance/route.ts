import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/auth/guards";
import { getUserBalance } from "@/lib/services/positions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireUser();
    const balance = await getUserBalance(user.id);
    return NextResponse.json({ balance });
  } catch (err) {
    return handleApiError(err);
  }
}
