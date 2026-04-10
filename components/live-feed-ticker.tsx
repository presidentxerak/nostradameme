"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { COPY } from "@/lib/config/copy";
import { formatRelative } from "@/lib/utils/dates";
import { formatUsd } from "@/lib/utils/currency";
import { useReducedMotionPreference } from "@/lib/hooks/use-reduced-motion";
import type { LiveFeedEntry } from "@/types/app";

interface LiveFeedTickerProps {
  feed: LiveFeedEntry[];
}

export function LiveFeedTicker({ feed }: LiveFeedTickerProps) {
  const reduce = useReducedMotionPreference();
  const [paused, setPaused] = useState(false);

  if (feed.length === 0) {
    return (
      <div className="flex h-10 items-center justify-center bg-surface/80 px-4 text-xs text-text-muted">
        {COPY.liveFeed.empty}
      </div>
    );
  }

  return (
    <div
      className="relative h-12 overflow-hidden border-t border-border bg-surface/90 backdrop-blur-md"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      aria-label={COPY.liveFeed.title}
    >
      <motion.div
        className="absolute inset-x-0 top-0 flex flex-col"
        animate={
          reduce || paused
            ? { y: 0 }
            : { y: [0, -feed.length * 48] }
        }
        transition={
          reduce || paused
            ? { duration: 0 }
            : {
                duration: Math.max(20, feed.length * 3),
                repeat: Infinity,
                ease: "linear",
              }
        }
      >
        {[...feed, ...feed].map((entry, idx) => (
          <FeedEntry key={`${entry.id}-${idx}`} entry={entry} />
        ))}
      </motion.div>
    </div>
  );
}

function FeedEntry({ entry }: { entry: LiveFeedEntry }) {
  const color = entry.side === "yes" ? "text-yes-glow" : "text-no-glow";
  const dot = entry.side === "yes" ? "bg-yes" : "bg-no";
  return (
    <div className="flex h-12 items-center gap-2 px-4 text-xs">
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <span className="truncate font-mono text-text-primary">
        @{entry.username}
      </span>
      <span className="text-text-secondary">{COPY.liveFeed.bet}</span>
      <span className="font-mono text-text-primary">
        {formatUsd(entry.amount)}
      </span>
      <span className={`font-bold ${color}`}>
        {entry.side === "yes" ? COPY.bet.yes : COPY.bet.no}
      </span>
      <span className="ml-auto text-text-muted">
        {formatRelative(entry.createdAt)}
      </span>
    </div>
  );
}
