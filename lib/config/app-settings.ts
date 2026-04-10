import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AppSettingsRow } from "@/types/db";

export async function getAppSettings(): Promise<AppSettingsRow> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("app_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return data as AppSettingsRow;
  // Create a default row.
  const { data: inserted, error } = await admin
    .from("app_settings")
    .insert({
      app_mode: "play_money",
      real_money_enabled: false,
      platform_fee_bps: 500,
      last_checked_ledger_index: 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return inserted as AppSettingsRow;
}

export async function updateAppSettings(
  patch: Partial<Pick<AppSettingsRow, "app_mode" | "real_money_enabled" | "platform_fee_bps">>,
): Promise<AppSettingsRow> {
  const admin = getAdminSupabase();
  const current = await getAppSettings();
  const { data, error } = await admin
    .from("app_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", current.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as AppSettingsRow;
}
