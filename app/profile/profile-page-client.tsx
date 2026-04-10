"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OracleIdentityCard } from "@/components/oracle-identity-card";
import { PredictionHistoryList } from "@/components/prediction-history-list";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { SettingsForm, type SettingsFormValues } from "@/components/settings-form";
import { OnrampWidget } from "@/components/onramp-widget";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/config/copy";
import type { HistoryEntry, LeaderboardEntry } from "@/types/app";

interface ProfilePageClientProps {
  userId: string;
  username: string;
  email: string | null;
  oracleTitle: string;
  winRate: number;
  totalPredictions: number;
  totalEarned: number;
  balance: number;
  initialHistory: HistoryEntry[];
  initialSettings: SettingsFormValues;
}

type Period = "all_time" | "weekly" | "daily";

export function ProfilePageClient(props: ProfilePageClientProps) {
  const [tab, setTab] = useState<"history" | "leaderboard" | "settings">(
    "history",
  );
  const [history, setHistory] = useState<HistoryEntry[]>(
    props.initialHistory,
  );
  const [historyOffset, setHistoryOffset] = useState(props.initialHistory.length);
  const [historyHasMore, setHistoryHasMore] = useState(
    props.initialHistory.length >= 50,
  );
  const [historyLoading, setHistoryLoading] = useState(false);

  const [period, setPeriod] = useState<Period>("all_time");
  const [lbEntries, setLbEntries] = useState<LeaderboardEntry[]>([]);
  const [lbCurrent, setLbCurrent] = useState<LeaderboardEntry | null>(null);
  const [lbLoading, setLbLoading] = useState(false);
  const [lbUpdatedAt, setLbUpdatedAt] = useState<string | undefined>();

  const [onrampOpen, setOnrampOpen] = useState(false);

  useEffect(() => {
    if (tab !== "leaderboard") return;
    let alive = true;
    setLbLoading(true);
    fetch(`/api/leaderboard?period=${period}`)
      .then((r) => r.json())
      .then(
        (data: {
          entries: LeaderboardEntry[];
          currentUserEntry: LeaderboardEntry | null;
          updatedAt: string;
        }) => {
          if (!alive) return;
          setLbEntries(data.entries);
          setLbCurrent(data.currentUserEntry);
          setLbUpdatedAt(data.updatedAt);
        },
      )
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLbLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tab, period]);

  const loadMoreHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(
        `/api/portfolio?limit=50&offset=${historyOffset}`,
      );
      const data = (await res.json()) as { entries: HistoryEntry[] };
      setHistory((prev) => [...prev, ...data.entries]);
      setHistoryOffset(historyOffset + data.entries.length);
      setHistoryHasMore(data.entries.length >= 50);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveSettings = async (values: SettingsFormValues) => {
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  const handleCloseAccount = async () => {
    const ok = window.confirm("Are you sure?");
    if (!ok) return;
    await fetch("/api/me/close-account", { method: "POST" });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="font-display text-xl tracking-widest text-accent-glow"
        >
          {COPY.header.logo}
        </Link>
        <span className="font-display text-sm text-text-secondary">
          {COPY.profile.title}
        </span>
        <Button size="sm" variant="outline" asChild>
          <Link href="/">{"\u2190"}</Link>
        </Button>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-5 p-4 pb-24">
        <OracleIdentityCard
          userId={props.userId}
          username={props.username}
          oracleTitle={props.oracleTitle}
          winRate={props.winRate}
          totalPredictions={props.totalPredictions}
          totalEarned={props.totalEarned}
        />

        <Tabs
          value={tab}
          onValueChange={(v) =>
            setTab(v as "history" | "leaderboard" | "settings")
          }
        >
          <TabsList className="w-full">
            <TabsTrigger value="history" className="flex-1">
              {COPY.profile.tabs.history}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1">
              {COPY.profile.tabs.leaderboard}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              {COPY.profile.tabs.settings}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <PredictionHistoryList
              entries={history}
              username={props.username}
              hasMore={historyHasMore}
              onLoadMore={loadMoreHistory}
              loading={historyLoading}
            />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTable
              entries={lbEntries}
              currentUserEntry={lbCurrent}
              period={period}
              onPeriodChange={setPeriod}
              loading={lbLoading}
              updatedAt={lbUpdatedAt}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsForm
              initial={props.initialSettings}
              email={props.email}
              oracleTitle={props.oracleTitle}
              balance={props.balance}
              onSave={handleSaveSettings}
              onAddFunds={() => setOnrampOpen(true)}
              onSignOut={handleSignOut}
              onCloseAccount={handleCloseAccount}
            />
          </TabsContent>
        </Tabs>
      </main>

      <OnrampWidget open={onrampOpen} onOpenChange={setOnrampOpen} />
    </div>
  );
}
