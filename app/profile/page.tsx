import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getUserBalance } from "@/lib/services/positions";
import { getUserHistory } from "@/lib/services/portfolio";
import { resolveUsername } from "@/lib/utils/meme-names";
import { getOracleTitleString } from "@/lib/oracle/titles";
import { ProfilePageClient } from "./profile-page-client";
import type { ProfileRow, UserSettingsRow } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/");
  }
  const admin = getAdminSupabase();
  const [{ data: profileRaw }, { data: settingsRaw }, history, balance] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      admin
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      getUserHistory(user.id, 50, 0),
      getUserBalance(user.id),
    ]);
  const profile = (profileRaw as ProfileRow | null) ?? null;
  const settings = (settingsRaw as UserSettingsRow | null) ?? null;

  const username = resolveUsername(user.id, profile?.username ?? null);
  const oracleTitle =
    profile?.oracle_title ??
    getOracleTitleString(
      Number(profile?.win_rate ?? 0),
      profile?.total_predictions ?? 0,
    );

  return (
    <ProfilePageClient
      userId={user.id}
      username={username}
      email={user.email}
      oracleTitle={oracleTitle}
      winRate={Number(profile?.win_rate ?? 0)}
      totalPredictions={profile?.total_predictions ?? 0}
      totalEarned={Number(profile?.total_earned ?? 0)}
      balance={balance}
      initialHistory={history}
      initialSettings={{
        username: profile?.username ?? "",
        notifyOnResolution: settings?.notify_on_resolution ?? true,
        notifyOnNewMarket: settings?.notify_on_new_market ?? false,
      }}
    />
  );
}
