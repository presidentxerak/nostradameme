"use client";

import { useState } from "react";
import { PredictionHistoryList } from "@/components/prediction-history-list";
import { BottomNav } from "@/components/bottom-nav";
import { AuthButton } from "@/components/auth-button";
import { COPY } from "@/lib/config/copy";
import type { HistoryEntry } from "@/types/app";

interface PredictionsClientProps {
  username: string;
  initialEntries: HistoryEntry[];
  isAuthed: boolean;
}

export function PredictionsClient(props: PredictionsClientProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>(props.initialEntries);
  const [offset, setOffset] = useState(props.initialEntries.length);
  const [hasMore, setHasMore] = useState(props.initialEntries.length >= 50);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio?limit=50&offset=${offset}`);
      const data = (await res.json()) as { entries: HistoryEntry[] };
      setEntries((prev) => [...prev, ...data.entries]);
      setOffset(offset + data.entries.length);
      setHasMore(data.entries.length >= 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden">
      <header className="z-40 flex items-center justify-between border-b border-border/20 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-lg text-accent-glow text-glow-accent">
          My predictions
        </h1>
        <AuthButton />
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto max-w-lg">
          {!props.isAuthed ? (
            <div className="flex flex-col items-center gap-5 pt-16 text-center">
              <div className="h-20 w-20 rounded-full bg-surface border border-border/40 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-text-muted">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 14l2 2 4-4" />
                </svg>
              </div>
              <p className="text-lg text-text-secondary">{COPY.auth.signInPrompt}</p>
              <AuthButton />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-4 pt-16 text-center">
              <p className="text-lg text-text-muted">{COPY.profile.history.empty}</p>
              <p className="text-sm text-text-muted">Make your first prediction on the Oracle page</p>
            </div>
          ) : (
            <PredictionHistoryList
              entries={entries}
              username={props.username}
              hasMore={hasMore}
              onLoadMore={loadMore}
              loading={loading}
            />
          )}
        </div>
      </main>

      <BottomNav active="predictions" />
    </div>
  );
}
