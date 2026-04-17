"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OracleIdentityCard } from "@/components/oracle-identity-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { SettingsForm, type SettingsFormValues } from "@/components/settings-form";
import { OnrampWidget } from "@/components/onramp-widget";
import { BalanceDisplay } from "@/components/balance-display";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
import type { LeaderboardEntry } from "@/types/app";

interface ProfilePageClientProps {
  userId: string;
  username: string;
  email: string | null;
  oracleTitle: string;
  winRate: number;
  totalPredictions: number;
  totalEarned: number;
  balance: number;
  initialSettings: SettingsFormValues;
}

type Period = "all_time" | "weekly" | "daily";

export function ProfilePageClient(props: ProfilePageClientProps) {
  const [tab, setTab] = useState<"wallet" | "leaderboard" | "settings">(
    "wallet",
  );
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
    <div className="relative flex h-[100dvh] flex-col bg-background overflow-hidden">
      <header className="z-40 border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-xl text-accent-glow text-glow-accent text-center">
          {COPY.profile.title}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto flex max-w-lg flex-col gap-5">
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
              setTab(v as "wallet" | "leaderboard" | "settings")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="wallet" className="flex-1">
                Wallet
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex-1">
                {COPY.profile.tabs.leaderboard}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                {COPY.profile.tabs.settings}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet">
              <Card className="flex flex-col items-center gap-4 py-6">
                <p className="text-xs uppercase tracking-widest text-text-muted">
                  {COPY.profile.identity.balance}
                </p>
                <div className="text-4xl font-bold text-text-primary">
                  <BalanceDisplay balance={props.balance} />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setOnrampOpen(true)}>
                    {COPY.profile.identity.addFunds}
                  </Button>
                </div>
              </Card>
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
        </div>
      </main>

      <BottomNav active="profile" />

      <OnrampWidget open={onrampOpen} onOpenChange={setOnrampOpen} />
    </div>
  );
}
