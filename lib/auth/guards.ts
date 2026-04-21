import "server-only";

import { NextResponse } from "next/server";
import { AppError, errorResponse } from "@/lib/utils/errors";
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/auth/session";
import { verifyPrivyAccessToken } from "@/lib/privy/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { env } from "@/lib/config/env";

export interface PrivyUser {
  id: string;
  privyUserId: string;
}

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

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("not_authed", "Please sign in", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  const admin = await isAdmin(user.id);
  if (!admin) {
    throw new AppError("forbidden", "Admin access required", 403);
  }
  return user;
}

export function requireCronAuth(req: Request): void {
  const header = req.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (token !== env.CRON_SECRET) {
    throw new AppError("forbidden", "Invalid cron credentials", 403);
  }
}

export function handleApiError(err: unknown): NextResponse {
  const { error, status } = errorResponse(err);
  return NextResponse.json({ error }, { status });
}
