import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, requireAdmin } from "@/lib/auth/guards";
import {
  getAppSettings,
  updateAppSettings,
} from "@/lib/config/app-settings";
import { AppError } from "@/lib/utils/errors";
import { logAdminAction } from "@/lib/audit/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchSchema = z.object({
  app_mode: z.enum(["play_money", "real_money"]).optional(),
  real_money_enabled: z.boolean().optional(),
  platform_fee_bps: z.number().int().min(0).max(5000).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const settings = await getAppSettings();
    return NextResponse.json(settings);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = PatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      throw new AppError("bad_request", parsed.error.message, 400);
    }
    const updated = await updateAppSettings(parsed.data);
    await logAdminAction({
      adminId: admin.id,
      action: "update_settings",
      entityType: "app_settings",
      details: parsed.data,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
