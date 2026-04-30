import { NextResponse } from "next/server";
import { handleApiError, requireAdminFromRequest } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireAdminFromRequest(req);
    return NextResponse.json({ ok: true, id: admin.id });
  } catch (err) {
    return handleApiError(err);
  }
}
