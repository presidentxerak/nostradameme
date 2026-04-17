import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { sendPushToUser, pushConfigured } from "@/lib/notifications/push";
import { sendEmail } from "@/lib/notifications/resend";
import { slotStartUtc } from "@/lib/utils/dates";
import { COPY } from "@/lib/config/copy";
import { env } from "@/lib/config/env";
import type { MarketSlot, ProfileRow, UserSettingsRow } from "@/types/db";

const LEAD_MINUTES = 15;
const WINDOW_MINUTES = 5;

export interface NotifyResult {
  slot: MarketSlot | null;
  slotStartAt: string | null;
  pushSent: number;
  emailsSent: number;
  skipped: number;
}

/**
 * Finds a slot opening between LEAD_MINUTES and LEAD_MINUTES - WINDOW_MINUTES
 * from now, and sends a push + email notification to opted-in users.
 */
export async function notifyUpcomingMarkets(
  now = new Date(),
): Promise<NotifyResult> {
  const slot = findUpcomingSlot(now);
  if (!slot) {
    return {
      slot: null,
      slotStartAt: null,
      pushSent: 0,
      emailsSent: 0,
      skipped: 0,
    };
  }

  const { slot: slotKey, startAt } = slot;
  const admin = getAdminSupabase();

  // Fetch users who opted in.
  const { data: settingsRaw } = await admin
    .from("user_settings")
    .select("user_id, notify_on_new_market")
    .eq("notify_on_new_market", true);
  const optedIn = (settingsRaw ?? []) as Array<
    Pick<UserSettingsRow, "user_id" | "notify_on_new_market">
  >;
  if (optedIn.length === 0) {
    return {
      slot: slotKey,
      slotStartAt: startAt.toISOString(),
      pushSent: 0,
      emailsSent: 0,
      skipped: 0,
    };
  }

  let pushSent = 0;
  let emailsSent = 0;
  let skipped = 0;
  const pushOn = pushConfigured();
  const resendOn = Boolean(env.RESEND_API_KEY);

  for (const s of optedIn) {
    const userId = s.user_id;

    // Push channel
    if (pushOn) {
      const already = await alreadyNotified(userId, slotKey, startAt, "push");
      if (!already) {
        const payload = buildPushPayload(slotKey);
        const result = await sendPushToUser(userId, payload);
        if (result.sent > 0) {
          pushSent++;
          await markNotified(userId, slotKey, startAt, "push");
        } else {
          skipped++;
        }
      }
    }

    // Email channel — only if user has no active push subscription.
    if (resendOn) {
      const hasPush = await userHasPushSubscription(userId);
      if (!hasPush) {
        const already = await alreadyNotified(
          userId,
          slotKey,
          startAt,
          "email",
        );
        if (!already) {
          const emailed = await sendSlotEmail(userId, slotKey);
          if (emailed) {
            emailsSent++;
            await markNotified(userId, slotKey, startAt, "email");
          }
        }
      }
    }
  }

  return {
    slot: slotKey,
    slotStartAt: startAt.toISOString(),
    pushSent,
    emailsSent,
    skipped,
  };
}

type DailySlot = "morning" | "noon" | "night";

function findUpcomingSlot(
  now: Date,
): { slot: DailySlot; startAt: Date } | null {
  const slots: DailySlot[] = ["morning", "noon", "night"];
  for (const slot of slots) {
    // Check today and tomorrow (for slots near midnight UTC).
    for (const offset of [0, 1]) {
      const ref = new Date(now);
      ref.setUTCDate(ref.getUTCDate() + offset);
      const start = slotStartUtc(slot, ref);
      const msUntil = start.getTime() - now.getTime();
      const leadMs = LEAD_MINUTES * 60 * 1000;
      const windowMs = WINDOW_MINUTES * 60 * 1000;
      if (msUntil <= leadMs && msUntil > leadMs - windowMs) {
        return { slot, startAt: start };
      }
    }
  }
  return null;
}

function buildPushPayload(slot: MarketSlot) {
  const meta = COPY.slots[slot];
  return {
    title: `${meta.emoji} ${meta.label}`,
    body: `A new prophecy opens in ${LEAD_MINUTES} minutes. The oracle awaits.`,
    url: "/",
    tag: `slot-${slot}`,
  };
}

async function alreadyNotified(
  userId: string,
  slot: MarketSlot,
  slotStart: Date,
  channel: "push" | "email",
): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("market_notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("slot", slot)
    .eq("slot_start_at", slotStart.toISOString())
    .eq("channel", channel)
    .maybeSingle();
  return Boolean(data);
}

async function markNotified(
  userId: string,
  slot: MarketSlot,
  slotStart: Date,
  channel: "push" | "email",
): Promise<void> {
  const admin = getAdminSupabase();
  await admin.from("market_notifications").insert({
    user_id: userId,
    slot,
    slot_start_at: slotStart.toISOString(),
    channel,
  });
}

async function userHasPushSubscription(userId: string): Promise<boolean> {
  const admin = getAdminSupabase();
  const { count } = await admin
    .from("push_subscriptions")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", userId);
  return (count ?? 0) > 0;
}

async function sendSlotEmail(
  userId: string,
  slot: MarketSlot,
): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data: profileRaw } = await admin
    .from("profiles")
    .select("id, display_name")
    .eq("id", userId)
    .maybeSingle();
  const profile = profileRaw as Pick<ProfileRow, "id" | "display_name"> | null;
  if (!profile) return false;

  const { data: auth } = await admin.auth.admin.getUserById(userId);
  const email = auth?.user?.email;
  if (!email) return false;

  const meta = COPY.slots[slot];
  const subject = `${meta.emoji} ${meta.label} opens soon`;
  const html = `
    <div style="font-family:Inter,sans-serif;background:#0a0a0f;color:#f8fafc;padding:32px;">
      <h1 style="color:#9d5cf0;">${meta.emoji} ${meta.label}</h1>
      <p>A new prophecy opens in ${LEAD_MINUTES} minutes.</p>
      <p>The oracle awaits. Do you dare to predict?</p>
      <p>
        <a href="${env.NEXT_PUBLIC_APP_URL}" style="color:#9d5cf0;text-decoration:underline;">
          Enter the chamber
        </a>
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
}
