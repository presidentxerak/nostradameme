"use client";

import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { BottomNav } from "@/components/bottom-nav";
import { AuthButton } from "@/components/auth-button";
import type { LeaderboardEntry } from "@/types/app";

type Period = "all_time" | "weekly" | "daily";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("all_time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [current, setCurrent] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then((data: { entries: LeaderboardEntry[]; currentUserEntry: LeaderboardEntry | null; updatedAt: string }) => {
        if (!alive) return;
        setEntries(data.entries);
        setCurrent(data.currentUserEntry);
        setUpdatedAt(data.updatedAt);
      })
      .catch(() => undefined)
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [period]);

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-40 flex items-center justify-between border-b border-border/20 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-2xl text-white">
          Leaderboard
        </h1>
        <AuthButton />
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto max-w-lg">
          <LeaderboardTable
            entries={entries}
            currentUserEntry={current}
            period={period}
            onPeriodChange={setPeriod}
            loading={loading}
            updatedAt={updatedAt}
          />
        </div>
      </main>

      <BottomNav active="leaderboard" />
    </div>
  );
}
