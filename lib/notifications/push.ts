import "server-only";

import webpush from "web-push";
import { env } from "@/lib/config/env";
import { getAdminSupabase } from "@/lib/supabase/admin";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  if (!env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return false;
  }
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  configured = true;
  return true;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count: number;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  if (!ensureConfigured()) {
    return { sent: 0, removed: 0 };
  }
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);
  const subs = (data ?? []) as PushSubscriptionRow[];
  if (subs.length === 0) return { sent: 0, removed: 0 };

  const json = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        json,
      );
      await admin
        .from("push_subscriptions")
        .update({
          last_used_at: new Date().toISOString(),
          failure_count: 0,
        })
        .eq("id", sub.id);
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number } | null)?.statusCode;
      if (status === 404 || status === 410) {
        // Subscription is gone — drop it.
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
        removed++;
      } else {
        await admin
          .from("push_subscriptions")
          .update({ failure_count: sub.failure_count + 1 })
          .eq("id", sub.id);
      }
    }
  }

  return { sent, removed };
}

export function vapidPublicKey(): string {
  return env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
}

export function pushConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}
