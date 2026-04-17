"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareProphecyButton } from "@/components/share-prophecy-button";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
import { formatRelative, formatRemaining } from "@/lib/utils/dates";
import type { HistoryEntry } from "@/types/app";

interface PredictionHistoryListProps {
  entries: HistoryEntry[];
  username: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

function slotLabel(slot: HistoryEntry["slot"]): string {
  return slot === "morning"
    ? COPY.slots.morning.short
    : slot === "noon"
      ? COPY.slots.noon.short
      : slot === "night"
        ? COPY.slots.night.short
        : COPY.slots.weekly.short;
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
        <Section title={COPY.profile.history.activeGroup}>
          {groups.active.map((e) => (
            <HistoryItem
              key={e.id}
              entry={e}
              username={username}
            />
          ))}
        </Section>
      )}
      {groups.won.length > 0 && (
        <Section title={COPY.profile.history.wonGroup}>
          {groups.won.map((e) => (
            <HistoryItem
              key={e.id}
              entry={e}
              username={username}
            />
          ))}
        </Section>
      )}
      {groups.lost.length > 0 && (
        <Section title={COPY.profile.history.lostGroup}>
          {groups.lost.map((e) => (
            <HistoryItem
              key={e.id}
              entry={e}
              username={username}
            />
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
      <h3 className="font-display text-sm uppercase tracking-widest text-text-muted">
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function HistoryItem({
  entry,
  username,
}: {
  entry: HistoryEntry;
  username: string;
}) {
  const sideLabel = entry.side === "yes" ? COPY.bet.yes : COPY.bet.no;

  return (
    <Card className="border-border">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span className="font-display text-[10px] tracking-widest text-accent">{slotLabel(entry.slot)}</span>
        <span className="font-mono">{entry.assetKey}</span>
        <span>&middot;</span>
        <span>{formatRelative(entry.createdAt)}</span>
      </div>
      <p className="mt-1 text-sm text-text-primary">{entry.question}</p>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="text-text-secondary">{COPY.profile.history.youSaid}:</span>
        <Badge variant={entry.side === "yes" ? "yes" : "no"}>
          {sideLabel}
        </Badge>
        <span className="font-mono text-text-primary">
          {formatUsd(entry.amount)}
        </span>
      </div>
      <div className="mt-2 text-xs">
        {entry.marketStatus !== "resolved" ? (
          <span className="text-text-secondary">
            {COPY.profile.history.status}: {COPY.profile.history.active} &middot;{" "}
            {formatRemaining(entry.endAt)} {COPY.profile.history.hoursLeft}
          </span>
        ) : entry.userWon ? (
          <span className="text-yes-glow">
            {COPY.profile.history.result}: {COPY.profile.history.won} ·{" "}
            +{formatUsd(entry.netPayout ?? 0)}
          </span>
        ) : (
          <span className="text-no-glow">
            {COPY.profile.history.result}: {COPY.profile.history.lost} ·{" "}
            -{formatUsd(entry.amount)}
          </span>
        )}
      </div>
      {entry.marketStatus === "resolved" && entry.userWon && (
        <div className="mt-3">
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
