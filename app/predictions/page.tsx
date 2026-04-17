import { getSessionUser } from "@/lib/auth/session";
import { PredictionsClient } from "./predictions-client";
import type { HistoryEntry } from "@/types/app";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  let user: { id: string; email: string | null } | null = null;
  let entries: HistoryEntry[] = [];
  let username = "anon_oracle";

  try {
    const { getSessionUser: getUser } = await import("@/lib/auth/session");
    user = await getUser();
  } catch {
    // auth unavailable
  }

  if (user) {
    try {
      const { getUserHistory } = await import("@/lib/services/portfolio");
      const { resolveUsername } = await import("@/lib/utils/meme-names");
      const { getAdminSupabase } = await import("@/lib/supabase/admin");
      entries = await getUserHistory(user.id, 50, 0);
      const admin = getAdminSupabase();
      const { data } = await admin
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      username = resolveUsername(
        user.id,
        (data as { username: string | null } | null)?.username ?? null,
      );
    } catch {
      // DB unavailable
    }
  }

  return (
    <PredictionsClient
      username={username}
      initialEntries={entries}
      isAuthed={Boolean(user)}
    />
  );
}
