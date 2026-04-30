import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/notifications/push";
import { sendEmail, buildResolutionEmail } from "@/lib/notifications/resend";
import { getUserEmail } from "@/lib/privy/server";
import { formatUsd } from "@/lib/utils/currency";
import { env } from "@/lib/config/env";
import type { MarketRow, ProfileRow } from "@/types/db";

interface ResolutionNotifyResult {
  pushSent: number;
  emailsSent: number;
  skipped: number;
}

export async function notifyResolutionResults(
  marketId: string,
  positions: Array<{
    userId: string;
    isWinner: boolean;
    netAmount: number;
    stake: number;
  }>,
): Promise<ResolutionNotifyResult> {
  const admin = getAdminSupabase();
  const result: ResolutionNotifyResult = { pushSent: 0, emailsSent: 0, skipped: 0 };

  const { data: marketRaw } = await admin
    .from("markets")
    .select("*")
    .eq("id", marketId)
    .maybeSingle();
  const market = marketRaw as MarketRow | null;
  if (!market) return result;

  const userIds = positions.map((p) => p.userId);
  if (userIds.length === 0) return result;

  const { data: settingsRaw } = await admin
    .from("user_settings")
    .select("user_id, notify_on_resolution")
    .in("user_id", userIds);
  const settings = new Map(
    ((settingsRaw ?? []) as Array<{ user_id: string; notify_on_resolution: boolean }>)
      .map((s) => [s.user_id, s.notify_on_resolution]),
  );

  const { data: profilesRaw } = await admin
    .from("profiles")
    .select("id, username, privy_user_id")
    .in("id", userIds);
  const profiles = new Map(
    ((profilesRaw ?? []) as Array<Pick<ProfileRow, "id" | "username" | "privy_user_id">>)
      .map((p) => [p.id, p]),
  );

  const appUrl = env.NEXT_PUBLIC_APP_URL;

  for (const pos of positions) {
    const wantsNotification = settings.get(pos.userId) ?? true;
    if (!wantsNotification) {
      result.skipped++;
      continue;
    }

    const profile = profiles.get(pos.userId);
    const username = profile?.username ?? "Oracle";

    const title = pos.isWinner
      ? `You won ${formatUsd(pos.netAmount)}!`
      : "The oracle has spoken";
    const body = pos.isWinner
      ? `Your prophecy was right: "${market.question}"`
      : `You lost ${formatUsd(pos.stake)} on: "${market.question}"`;

    try {
      const pushResult = await sendPushToUser(pos.userId, {
        title,
        body,
        url: `${appUrl}/predictions`,
        tag: `resolution-${marketId}`,
      });
      if (pushResult.sent > 0) {
        result.pushSent++;
        continue;
      }
    } catch {
      // push failed, fall through to email
    }

    try {
      const privyId = profile?.privy_user_id ?? null;
      if (!privyId) {
        result.skipped++;
        continue;
      }

      const email = await getUserEmail(privyId);
      if (!email) {
        result.skipped++;
        continue;
      }

      const { subject, html } = buildResolutionEmail({
        username,
        question: market.question,
        won: pos.isWinner,
        amount: pos.isWinner ? pos.netAmount : pos.stake,
        marketUrl: `${appUrl}/predictions`,
      });
      const sent = await sendEmail({ to: email, subject, html });
      if (sent) result.emailsSent++;
      else result.skipped++;
    } catch {
      result.skipped++;
    }
  }

  return result;
}
