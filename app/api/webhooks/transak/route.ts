import { NextResponse } from "next/server";
import { parseWebhookPayload, verifyTransakSignature } from "@/lib/onramp/transak";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/auth/guards";
import { env } from "@/lib/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    // Reject unsigned webhooks unless the secret is unset (local dev only).
    if (env.TRANSAK_SECRET_KEY) {
      const signature =
        req.headers.get("x-transak-signature") ??
        req.headers.get("transak-signature");
      if (!verifyTransakSignature(rawBody, signature)) {
        return NextResponse.json(
          { error: { code: "bad_signature", message: "Invalid webhook signature" } },
          { status: 401 },
        );
      }
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: { code: "bad_webhook", message: "Invalid JSON" } },
        { status: 400 },
      );
    }

    const event = parseWebhookPayload(parsedJson);
    if (!event) {
      return NextResponse.json(
        { error: { code: "bad_webhook", message: "Invalid webhook" } },
        { status: 400 },
      );
    }
    const admin = getAdminSupabase();
    // Idempotency by external_event_id.
    const { data: existing } = await admin
      .from("webhook_events")
      .select("id, processed")
      .eq("provider", "transak")
      .eq("external_event_id", event.eventID)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, deduped: true });
    }
    await admin.from("webhook_events").insert({
      provider: "transak",
      external_event_id: event.eventID,
      event_type: event.webhookData.status,
      payload: event,
    });

    // Update deposit intent status based on Transak lifecycle.
    const orderId = event.webhookData.id;
    const partnerOrderId = event.webhookData.partnerOrderId;
    const target = partnerOrderId ?? null;
    if (target) {
      const status = mapStatus(event.webhookData.status);
      await admin
        .from("deposit_intents")
        .update({
          status,
          transak_order_id: orderId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", target);
    }

    await admin
      .from("webhook_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq("provider", "transak")
      .eq("external_event_id", event.eventID);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

function mapStatus(
  status: string,
): "pending" | "processing" | "confirmed" | "failed" {
  const s = status.toLowerCase();
  if (s.includes("completed") || s.includes("success")) return "processing";
  if (s.includes("fail") || s.includes("cancel")) return "failed";
  if (s.includes("processing") || s.includes("order")) return "processing";
  return "pending";
}
