"use client";

import { useState } from "react";
import { PredictionHistoryList } from "@/components/prediction-history-list";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
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
    <div className="relative flex h-[100dvh] flex-col bg-background overflow-hidden">
      <header className="z-40 border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur-md">
        <h1 className="font-display text-xl text-accent-glow text-glow-accent text-center">
          My predictions
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4">
        <div className="mx-auto max-w-lg">
          {!props.isAuthed ? (
            <div className="rounded-2xl border border-border/40 bg-surface/60 p-8 text-center">
              <p className="text-base text-text-muted mb-4">{COPY.auth.signInPrompt}</p>
              <Button variant="default">{COPY.auth.signIn}</Button>
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
