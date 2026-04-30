import "server-only";

import { getServerPrivyUser } from "@/lib/auth/privy-cookie";
import { getAdminSupabase } from "@/lib/supabase/admin";

export interface SessionUser {
  id: string;
  email: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const user = await getServerPrivyUser();
  if (!user) return null;
  return { id: user.id, email: user.email };
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
