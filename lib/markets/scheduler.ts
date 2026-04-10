import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { slotStartUtc, weekStartUtc } from "@/lib/utils/dates";
import type { MarketSlot } from "@/types/db";

export async function marketAlreadyExistsForSlot(
  slot: MarketSlot,
): Promise<boolean> {
  const admin = getAdminSupabase();
  const startAt =
    slot === "weekly" ? weekStartUtc() : slotStartUtc(slot);
  const { data } = await admin
    .from("markets")
    .select("id")
    .eq("slot", slot)
    .eq("start_at", startAt.toISOString())
    .maybeSingle();
  return Boolean(data);
}
