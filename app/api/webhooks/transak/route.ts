import { NextResponse } from "next/server";
import { z } from "zod";
import {
  parseWebhookPayload,
  verifyTransakJwt,
} from "@/lib/onramp/transak";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/auth/guards";
import { env } from "@/lib/config/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EnvelopeSchema = z.object({
  data: z.string().min(20),
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: { code: "bad_webhook", message: "Invalid JSON" } },
        { status: 400 },
      );
    }

    let eventPayload: unknown;
    if (env.TRANSAK_SECRET_KEY) {
      // Verified path: body is `{ data: "<jwt>" }`. Verify the JWT signature
      // with our API secret; the decoded payload becomes the event.
      const envelope = EnvelopeSchema.safeParse(parsedJson);
      if (!envelope.success) {
        return NextResponse.json(
          { error: { code: "bad_envelope", message: "Missing data field" } },
          { status: 400 },
        );
      }
      const verified = verifyTransakJwt(envelope.data.data);
      if (!verified) {
        return NextResponse.json(
          {
            error: {
              code: "bad_signature",
              message: "Invalid webhook signature",
            },
          },
          { status: 401 },
        );
      }
      eventPayload = verified;
    } else {
      // Unverified dev fallback: accept the raw body as the event payload.
      eventPayload = parsedJson;
    }

    const event = parseWebhookPayload(eventPayload);
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
