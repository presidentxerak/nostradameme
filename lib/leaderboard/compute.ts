import "server-only";

import { getAdminSupabase } from "@/lib/supabase/admin";
import { getOracleTitleString } from "@/lib/oracle/titles";
import { resolveUsername } from "@/lib/utils/meme-names";
import type {
  LeaderboardSnapshotRow,
  ProfileRow,
} from "@/types/db";
import type { LeaderboardEntry } from "@/types/app";

type Period = "all_time" | "weekly" | "daily";

function periodStart(period: Period): string {
  const now = new Date();
  if (period === "daily") {
    return now.toISOString().slice(0, 10);
  }
  if (period === "weekly") {
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + diff,
      ),
    );
    return monday.toISOString().slice(0, 10);
  }
  return "1970-01-01";
}

export async function computeAllTimeLeaderboard(): Promise<LeaderboardEntry[]> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .gt("total_predictions", 0)
    .order("total_earned", { ascending: false })
    .order("win_rate", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as ProfileRow[];
  return rows.map((p, i) => ({
    rank: i + 1,
    userId: p.id,
    username: resolveUsername(p.id, p.username),
    winRate: Number(p.win_rate),
    totalEarned: Number(p.total_earned),
    totalPredictions: p.total_predictions,
    oracleTitle: getOracleTitleString(
      Number(p.win_rate),
      p.total_predictions,
    ),
  }));
}

export async function computeWindowedLeaderboard(
  period: Period,
): Promise<LeaderboardEntry[]> {
  if (period === "all_time") return computeAllTimeLeaderboard();
  const admin = getAdminSupabase();
  const now = new Date();
  let startIso: string;
  if (period === "daily") {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    startIso = d.toISOString();
  } else {
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + diff,
      ),
    );
    startIso = monday.toISOString();
  }

  // Aggregate payouts + positions since the period start.
  const { data: payoutRows } = await admin
    .from("payouts")
    .select("user_id, net_amount, gross_amount, created_at, status")
    .gte("created_at", startIso);

  const tallies = new Map<
    string,
    { earned: number; won: number; total: number }
  >();

  for (const row of payoutRows ?? []) {
    const p = row as {
      user_id: string;
      net_amount: number | string;
      gross_amount: number | string;
    };
    const prev = tallies.get(p.user_id) ?? { earned: 0, won: 0, total: 0 };
    const net = Number(p.net_amount);
    prev.earned += net;
    prev.total += 1;
    if (net > 0) prev.won += 1;
    tallies.set(p.user_id, prev);
  }

  const entries: LeaderboardEntry[] = [];
  for (const [userId, t] of tallies.entries()) {
    const { data: profileRaw } = await admin
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .maybeSingle();
    const profile = profileRaw as Pick<ProfileRow, "id" | "username"> | null;
    if (!profile) continue;
    const winRate = t.total > 0 ? (t.won / t.total) * 100 : 0;
    entries.push({
      rank: 0,
      userId,
      username: resolveUsername(userId, profile.username),
      winRate: Number(winRate.toFixed(2)),
      totalEarned: t.earned,
      totalPredictions: t.total,
      oracleTitle: getOracleTitleString(winRate, t.total),
    });
  }
  entries.sort((a, b) => b.totalEarned - a.totalEarned);
  entries.forEach((e, i) => (e.rank = i + 1));
  return entries.slice(0, 100);
}

export async function snapshotLeaderboard(period: Period): Promise<number> {
  const admin = getAdminSupabase();
  const entries = await computeWindowedLeaderboard(period);
  const start = periodStart(period);
  await admin
    .from("leaderboard_snapshots")
    .delete()
    .eq("period", period)
    .eq("period_start", start);
  if (entries.length === 0) return 0;
  const rows: Omit<
    LeaderboardSnapshotRow,
    "id" | "updated_at"
  >[] = entries.map((e) => ({
    period,
    period_start: start,
    user_id: e.userId,
    rank: e.rank,
    win_rate: e.winRate,
    total_earned: e.totalEarned,
    total_predictions: e.totalPredictions,
    oracle_title: e.oracleTitle,
    username: e.username,
  }));
  const { error } = await admin.from("leaderboard_snapshots").insert(rows);
  if (error) throw error;
  return rows.length;
}

export async function getLeaderboardSnapshot(
  period: Period,
  currentUserId?: string,
): Promise<{ entries: LeaderboardEntry[]; currentUserEntry: LeaderboardEntry | null }> {
  const admin = getAdminSupabase();
  const start = periodStart(period);
  const { data } = await admin
    .from("leaderboard_snapshots")
    .select("*")
    .eq("period", period)
    .eq("period_start", start)
    .order("rank", { ascending: true })
    .limit(100);
  const rows = (data ?? []) as LeaderboardSnapshotRow[];
  const entries: LeaderboardEntry[] = rows.map((r) => ({
    rank: r.rank,
    userId: r.user_id,
    username: r.username,
    winRate: Number(r.win_rate),
    totalEarned: Number(r.total_earned),
    totalPredictions: r.total_predictions,
    oracleTitle: r.oracle_title,
    isCurrentUser: currentUserId === r.user_id,
  }));
  let currentUserEntry: LeaderboardEntry | null =
    entries.find((e) => e.userId === currentUserId) ?? null;
  if (!currentUserEntry && currentUserId) {
    const { data: ownRaw } = await admin
      .from("leaderboard_snapshots")
      .select("*")
      .eq("period", period)
      .eq("period_start", start)
      .eq("user_id", currentUserId)
      .maybeSingle();
    const own = ownRaw as LeaderboardSnapshotRow | null;
    if (own) {
      currentUserEntry = {
        rank: own.rank,
        userId: own.user_id,
        username: own.username,
        winRate: Number(own.win_rate),
        totalEarned: Number(own.total_earned),
        totalPredictions: own.total_predictions,
        oracleTitle: own.oracle_title,
        isCurrentUser: true,
      };
    }
  }
  return { entries, currentUserEntry };
}

export async function updateAllOracleTitles(): Promise<number> {
  const admin = getAdminSupabase();
  const { data } = await admin
    .from("profiles")
    .select("id, win_rate, total_predictions, oracle_title");
  const rows = (data ?? []) as Array<{
    id: string;
    win_rate: number;
    total_predictions: number;
    oracle_title: string;
  }>;
  let updated = 0;
  for (const r of rows) {
    const newTitle = getOracleTitleString(
      Number(r.win_rate),
      r.total_predictions,
    );
    if (newTitle !== r.oracle_title) {
      await admin
        .from("profiles")
        .update({
          oracle_title: newTitle,
          updated_at: new Date().toISOString(),
        })
        .eq("id", r.id);
      updated++;
    }
  }
  return updated;
}
