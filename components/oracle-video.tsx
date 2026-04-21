"use client";

import { useEffect, useRef, useState } from "react";
import { msUntil } from "@/lib/utils/dates";

type VideoPhase = "stand" | "start" | "ended";

const VIDEO_SRC: Record<VideoPhase, string> = {
  stand: "/videos/prediction-stand.mp4",
  start: "/videos/prediction-start.mp4",
  ended: "/videos/prediction-ended.mp4",
};

interface OracleVideoProps {
  startAt: string | null;
  endAt: string | null;
  className?: string;
}

function computePhase(startAt: string | null, endAt: string | null): VideoPhase {
  if (!startAt || !endAt) return "stand";
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  if (now < start) return "stand";
  if (now >= end) return "ended";

  const elapsed = now - start;
  const remaining = end - now;

  if (elapsed < 30000) return "stand";
  if (remaining < 30000) return "ended";
  return "start";
}

export function OracleVideo({ startAt, endAt, className }: OracleVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<VideoPhase>(() => computePhase(startAt, endAt));

  useEffect(() => {
    const update = () => setPhase(computePhase(startAt, endAt));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startAt, endAt]);

  const src = VIDEO_SRC[phase];

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.src !== src && !el.src.endsWith(src)) {
      el.src = src;
      el.load();
      el.play().catch(() => {});
    }
  }, [src]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border/30 bg-surface/40 ${className ?? ""}`}>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover"
      />
    </div>
  );
}
