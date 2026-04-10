import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supa = await getServerSupabase();
    await supa.auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
