import "server-only";

import { NextResponse } from "next/server";
import { AppError, errorResponse } from "@/lib/utils/errors";
import { getSessionUser, isAdmin, type SessionUser } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

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
