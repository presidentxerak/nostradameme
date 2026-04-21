import { NextResponse } from "next/server";
import { handleApiError, requirePrivyUser } from "@/lib/auth/guards";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requirePrivyUser(req);
    const admin = getAdminSupabase();
    // Soft delete: anonymize username, reset display name, keep history.
    await admin
      .from("profiles")
      .update({
        username: null,
        display_name: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
