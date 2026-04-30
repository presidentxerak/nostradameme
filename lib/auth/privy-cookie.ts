import "server-only";

import { cookies } from "next/headers";
import { verifyPrivyAccessToken } from "@/lib/privy/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const PRIVY_COOKIE_NAME = "nostradameme_privy_token";
const COOKIE_MAX_AGE = 60 * 60; // 1 hour, matches Privy access token TTL

export interface CookiePrivyUser {
  id: string;
  privyUserId: string;
  email: string | null;
  role: string;
}

export async function getServerPrivyUser(): Promise<CookiePrivyUser | null> {
  const store = await cookies();
  const token = store.get(PRIVY_COOKIE_NAME)?.value;
  if (!token) return null;
  const verified = await verifyPrivyAccessToken(token);
  if (!verified) return null;
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("id, role")
    .eq("privy_user_id", verified.userId)
    .maybeSingle();
  if (!data) return null;
  const profile = data as { id: string; role: string };
  return {
    id: profile.id,
    privyUserId: verified.userId,
    email: null,
    role: profile.role,
  };
}

export async function setPrivyCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(PRIVY_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearPrivyCookie(): Promise<void> {
  const store = await cookies();
  store.delete(PRIVY_COOKIE_NAME);
}
