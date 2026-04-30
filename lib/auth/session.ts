import "server-only";

import { getServerPrivyUser } from "@/lib/auth/privy-cookie";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/types/db";

export interface SessionUser {
  id: string;
  email: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const user = await getServerPrivyUser();
  if (!user) return null;
  return { id: user.id, email: user.email };
}

export async function getSessionProfile(): Promise<{
  user: SessionUser;
  profile: ProfileRow;
} | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  return { user, profile: data as ProfileRow };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return (data as { role?: string } | null)?.role === "admin";
}

export async function ensureProfile(
  userId: string,
  email: string | null,
): Promise<ProfileRow> {
  const admin = getAdminSupabase();
  const { data: existing } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (existing) return existing as ProfileRow;
  const { data: inserted, error } = await admin
    .from("profiles")
    .insert({
      id: userId,
      display_name: email?.split("@")[0] ?? null,
      role: "player",
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create profile: ${error.message}`);
  }
  await admin
    .from("user_settings")
    .insert({ user_id: userId })
    .select("user_id");
  return inserted as ProfileRow;
}
