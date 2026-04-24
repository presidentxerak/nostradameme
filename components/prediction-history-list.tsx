"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareProphecyButton } from "@/components/share-prophecy-button";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
import { formatRelative, formatRemainingLong } from "@/lib/utils/dates";
import type { HistoryEntry } from "@/types/app";

interface PredictionHistoryListProps {
  entries: HistoryEntry[];
  username: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

function groupEntries(entries: HistoryEntry[]) {
  const active: HistoryEntry[] = [];
  const won: HistoryEntry[] = [];
  const lost: HistoryEntry[] = [];
  for (const e of entries) {
    if (e.marketStatus !== "resolved") {
      active.push(e);
    } else if (e.userWon) {
      won.push(e);
    } else {
      lost.push(e);
    }
  }
  return { active, won, lost };
}

export function PredictionHistoryList({
  entries,
  username,
  onLoadMore,
  hasMore,
  loading,
}: PredictionHistoryListProps) {
  const groups = groupEntries(entries);
  if (entries.length === 0 && !loading) {
    return (
      <p className="py-10 text-center text-text-muted">
        {COPY.profile.history.empty}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {groups.active.length > 0 && (
        <Section title={`${COPY.profile.history.activeGroup} (${groups.active.length})`}>
          {groups.active.map((e) => (
            <ActiveItem key={e.id} entry={e} />
          ))}
        </Section>
      )}
      {groups.won.length > 0 && (
        <Section title={`${COPY.profile.history.wonGroup} (${groups.won.length})`}>
          {groups.won.map((e) => (
            <ResolvedItem key={e.id} entry={e} username={username} />
          ))}
        </Section>
      )}
      {groups.lost.length > 0 && (
        <Section title={`${COPY.profile.history.lostGroup} (${groups.lost.length})`}>
          {groups.lost.map((e) => (
            <ResolvedItem key={e.id} entry={e} username={username} />
          ))}
        </Section>
      )}
      {hasMore && onLoadMore && (
        <Button variant="outline" onClick={onLoadMore} disabled={loading}>
          {COPY.profile.history.loadMore}
        </Button>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-sans text-xs uppercase tracking-widest text-text-muted">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ActiveItem({ entry }: { entry: HistoryEntry }) {
  const [countdown, setCountdown] = useState(() => formatRemainingLong(entry.endAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatRemainingLong(entry.endAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [entry.endAt]);

  const sideLabel = entry.side === "yes" ? COPY.bet.yes : COPY.bet.no;

  return (
    <Card className="border-accent/30">
      <p className="text-sm font-bold text-text-primary">{entry.question}</p>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="text-text-secondary">{COPY.profile.history.youSaid}:</span>
        <Badge variant={entry.side === "yes" ? "yes" : "no"}>{sideLabel}</Badge>
        <span className="font-mono text-text-primary">{formatUsd(entry.amount)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg bg-accent/10 px-3 py-2">
        <span className="text-xs text-text-muted">Result in:</span>
        <span className="font-mono text-sm font-bold text-accent-glow">{countdown}</span>
      </div>
    </Card>
  );
}

function ResolvedItem({ entry, username }: { entry: HistoryEntry; username: string }) {
  const won = entry.userWon === true;
  const oracleAnswer = entry.resolutionSide === "yes" ? "YES" : "NO";
  const userSide = entry.side === "yes" ? "YES" : "NO";

  return (
    <Card className={won ? "border-yes/40" : "border-no/40"}>
      <p className="text-sm font-bold text-text-primary">{entry.question}</p>

      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="text-text-secondary">You said:</span>
        <Badge variant={entry.side === "yes" ? "yes" : "no"}>{userSide}</Badge>
        <span className="font-mono text-text-primary">{formatUsd(entry.amount)}</span>
      </div>

      <div className={`mt-3 rounded-lg px-4 py-3 ${won ? "bg-yes/10 border border-yes/30" : "bg-no/10 border border-no/30"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">The oracle answered:</p>
            <p className={`text-lg font-bold ${entry.resolutionSide === "yes" ? "text-yes-glow" : "text-no-glow"}`}>
              {oracleAnswer}
            </p>
          </div>
          <div className="text-right">
            {won ? (
              <>
                <p className="text-xs text-yes">You won</p>
                <p className="text-xl font-bold text-yes-glow">+{formatUsd(entry.netPayout ?? 0)}</p>
              </>
            ) : (
              <>
                <p className="text-xs text-no">You lost</p>
                <p className="text-xl font-bold text-no-glow">-{formatUsd(entry.amount)}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2 text-right text-[10px] text-text-muted">{formatRelative(entry.createdAt)}</p>

      {won && (
        <div className="mt-2">
          <ShareProphecyButton
            marketId={entry.marketId}
            side={entry.side}
            won
            amount={entry.netPayout ?? entry.amount}
            username={username}
            marketQuestion={entry.question}
          />
        </div>
      )}
    </Card>
  );
}
