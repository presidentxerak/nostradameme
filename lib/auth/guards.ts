import "server-only";

import { NextResponse } from "next/server";
import { AppError, errorResponse } from "@/lib/utils/errors";
import { isAdmin, type SessionUser } from "@/lib/auth/session";
import { verifyPrivyAccessToken } from "@/lib/privy/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { env } from "@/lib/config/env";

export interface PrivyUser {
  id: string;
  privyUserId: string;
}

/**
 * Bearer-token Privy auth for API routes. Verifies the token with Privy and
 * resolves the corresponding profile.
 */
export async function requirePrivyUser(req: Request): Promise<PrivyUser> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new AppError("not_authed", "Please sign in", 401);
  }
  const verified = await verifyPrivyAccessToken(token);
  if (!verified) {
    throw new AppError("not_authed", "Invalid session", 401);
  }
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("privy_user_id", verified.userId)
    .maybeSingle();
  if (!data) {
    throw new AppError("no_profile", "Profile not found. Please sign in again.", 404);
  }
  return {
    id: (data as { id: string }).id,
    privyUserId: verified.userId,
  };
}

export async function requireUserFromRequest(req: Request): Promise<SessionUser> {
  const u = await requirePrivyUser(req);
  return { id: u.id, email: null };
}

export async function requireAdminFromRequest(req: Request): Promise<SessionUser> {
  const user = await requireUserFromRequest(req);
  const isUserAdmin = await isAdmin(user.id);
  if (!isUserAdmin) {
    throw new AppError("forbidden", "Admin access required", 403);
  }
  return user;
}

export function requireCronAuth(req: Request): void {
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!env.CRON_SECRET || token !== env.CRON_SECRET) {
    throw new AppError("forbidden", "Invalid cron credentials", 403);
  }
}

export function handleApiError(err: unknown): NextResponse {
  const { error, status } = errorResponse(err);
  return NextResponse.json({ error }, { status });
}
