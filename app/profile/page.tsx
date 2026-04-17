import { redirect } from "next/navigation";
import { ProfilePageClient } from "./profile-page-client";
import type { ProfileRow, UserSettingsRow } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let userId = "";
  let email: string | null = null;
  let username = "anon_oracle";
  let oracleTitle = "Seeker";
  let winRate = 0;
  let totalPredictions = 0;
  let totalEarned = 0;
  let balance = 0;
  let settingsValues = {
    username: "",
    notifyOnResolution: true,
    notifyOnNewMarket: false,
  };

  try {
    const { getSessionUser } = await import("@/lib/auth/session");
    const user = await getSessionUser();
    if (!user) redirect("/");
    userId = user.id;
    email = user.email;

    const { getAdminSupabase } = await import("@/lib/supabase/admin");
    const { getUserBalance } = await import("@/lib/services/positions");
    const { resolveUsername } = await import("@/lib/utils/meme-names");
    const { getOracleTitleString } = await import("@/lib/oracle/titles");

    const admin = getAdminSupabase();
    const [{ data: profileRaw }, { data: settingsRaw }, bal] =
      await Promise.all([
        admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        admin
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        getUserBalance(user.id),
      ]);
    const profile = profileRaw as ProfileRow | null;
    const settings = settingsRaw as UserSettingsRow | null;

    balance = bal;
    username = resolveUsername(user.id, profile?.username ?? null);
    oracleTitle =
      profile?.oracle_title ??
      getOracleTitleString(
        Number(profile?.win_rate ?? 0),
        profile?.total_predictions ?? 0,
      );
    winRate = Number(profile?.win_rate ?? 0);
    totalPredictions = profile?.total_predictions ?? 0;
    totalEarned = Number(profile?.total_earned ?? 0);
    settingsValues = {
      username: profile?.username ?? "",
      notifyOnResolution: settings?.notify_on_resolution ?? true,
      notifyOnNewMarket: settings?.notify_on_new_market ?? false,
    };
  } catch {
    redirect("/");
  }

  return (
    <ProfilePageClient
      userId={userId}
      username={username}
      email={email}
      oracleTitle={oracleTitle}
      winRate={winRate}
      totalPredictions={totalPredictions}
      totalEarned={totalEarned}
      balance={balance}
      initialSettings={settingsValues}
    />
  );
}
