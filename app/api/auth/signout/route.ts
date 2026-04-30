import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/auth/guards";
import { clearPrivyCookie } from "@/lib/auth/privy-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await clearPrivyCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
