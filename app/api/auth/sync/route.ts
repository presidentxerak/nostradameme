import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/auth/guards";
import { ensureProfile } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await requireUser();
    const profile = await ensureProfile(user.id, user.email);
    return NextResponse.json({ ok: true, profileId: profile.id });
  } catch (err) {
    return handleApiError(err);
  }
}
