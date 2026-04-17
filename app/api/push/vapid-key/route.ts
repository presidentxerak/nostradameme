import { NextResponse } from "next/server";
import { vapidPublicKey, pushConfigured } from "@/lib/notifications/push";
import { handleApiError } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({
      publicKey: pushConfigured() ? vapidPublicKey() : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
