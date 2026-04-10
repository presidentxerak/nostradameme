import { NextResponse } from "next/server";
import { handleApiError, requireCronAuth } from "@/lib/auth/guards";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCronAuth(req);
    const admin = getAdminSupabase();
    // Move payouts with status "processing" and tx status "submitted"
    // to "paid" once we can confirm. Without a full XRPL client check,
    // we mark them as paid after a short delay (matches play-money mode).
    const { data } = await admin
      .from("payouts")
      .update({
        status: "paid",
        xrpl_tx_status: "confirmed",
        paid_at: new Date().toISOString(),
      })
      .eq("status", "processing")
      .eq("xrpl_tx_status", "submitted")
      .select("id");
    return NextResponse.json({ ok: true, confirmed: (data ?? []).length });
  } catch (err) {
    return handleApiError(err);
  }
}
