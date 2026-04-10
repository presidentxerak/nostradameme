"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import type { LeaderboardEntry } from "@/types/app";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  period: "all_time" | "weekly" | "daily";
  onPeriodChange: (period: "all_time" | "weekly" | "daily") => void;
  loading?: boolean;
  updatedAt?: string;
}

function medalFor(rank: number): string {
  if (rank === 1) return "\u{1f947}";
  if (rank === 2) return "\u{1f948}";
  if (rank === 3) return "\u{1f949}";
  return "";
}

export function LeaderboardTable({
  entries,
  currentUserEntry,
  period,
  onPeriodChange,
  loading,
  updatedAt,
}: LeaderboardTableProps) {
  const currentInList = currentUserEntry
    ? entries.some((e) => e.userId === currentUserEntry.userId)
    : false;

  return (
    <div className="flex flex-col gap-4">
      <Tabs
        value={period}
        onValueChange={(v) =>
          onPeriodChange(v as "all_time" | "weekly" | "daily")
        }
      >
        <TabsList>
          <TabsTrigger value="all_time">
            {COPY.profile.leaderboard.periods.all_time}
          </TabsTrigger>
          <TabsTrigger value="weekly">
            {COPY.profile.leaderboard.periods.weekly}
          </TabsTrigger>
          <TabsTrigger value="daily">
            {COPY.profile.leaderboard.periods.daily}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="py-10 text-center text-text-muted">
          {COPY.profile.leaderboard.empty}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface/60">
          <div className="grid grid-cols-[40px_1fr_60px_90px_60px] gap-2 border-b border-border bg-background/40 px-3 py-2 text-[10px] uppercase tracking-widest text-text-muted">
            <span>{COPY.profile.leaderboard.columns.rank}</span>
            <span>{COPY.profile.leaderboard.columns.oracle}</span>
            <span className="text-right">
              {COPY.profile.leaderboard.columns.winRate}
            </span>
            <span className="text-right">
              {COPY.profile.leaderboard.columns.earned}
            </span>
            <span className="text-right">
              {COPY.profile.leaderboard.columns.bets}
            </span>
          </div>
          <div className="divide-y divide-border">
            {entries.map((entry) => (
              <Row key={entry.userId} entry={entry} />
            ))}
            {currentUserEntry && !currentInList && (
              <div className="border-t-2 border-accent/40 bg-accent/10">
                <Row entry={currentUserEntry} pinned />
              </div>
            )}
          </div>
        </div>
      )}
      {updatedAt && (
        <p className="text-center text-xs text-text-muted">
          {COPY.profile.leaderboard.updated}:{" "}
          {new Date(updatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

function Row({
  entry,
  pinned,
}: {
  entry: LeaderboardEntry;
  pinned?: boolean;
}) {
  const medal = medalFor(entry.rank);
  return (
    <div
      className={cn(
        "grid grid-cols-[40px_1fr_60px_90px_60px] items-center gap-2 px-3 py-3 text-sm",
        entry.isCurrentUser && "bg-accent/10",
      )}
    >
      <span className="font-mono text-text-secondary">
        {medal || entry.rank}
      </span>
      <div className="flex flex-col overflow-hidden">
        <span
          className={cn(
            "truncate font-mono",
            entry.isCurrentUser ? "text-accent-glow" : "text-text-primary",
          )}
        >
          @{entry.username}
          {entry.isCurrentUser && (
            <span className="ml-2 text-[10px] text-accent">
              {COPY.profile.leaderboard.you}
            </span>
          )}
          {pinned && (
            <span className="ml-2 text-[10px] text-text-muted">
              (pinned)
            </span>
          )}
        </span>
        <span className="truncate text-[10px] text-text-muted">
          {entry.oracleTitle}
        </span>
      </div>
      <span className="text-right font-mono text-text-primary">
        {entry.winRate.toFixed(0)}%
      </span>
      <span className="text-right font-mono text-gold-glow">
        {formatUsd(entry.totalEarned)}
      </span>
      <span className="text-right font-mono text-text-secondary">
        {entry.totalPredictions}
      </span>
    </div>
  );
}
