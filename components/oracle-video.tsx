"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketStatus } from "@/types/db";

type VideoState = "stand" | "start" | "ended";

function mapStatusToVideo(status: MarketStatus): VideoState {
  if (status === "open") return "start";
  if (status === "resolved" || status === "canceled") return "ended";
  return "stand";
}

const VIDEO_SRC: Record<VideoState, string> = {
  stand: "/videos/prediction-stand.mp4",
  start: "/videos/prediction-start.mp4",
  ended: "/videos/prediction-ended.mp4",
};

interface OracleVideoProps {
  status: MarketStatus;
  className?: string;
}

export function OracleVideo({ status, className }: OracleVideoProps) {
  const videoState = mapStatusToVideo(status);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState(VIDEO_SRC[videoState]);

  useEffect(() => {
    const newSrc = VIDEO_SRC[videoState];
    if (newSrc !== currentSrc) {
      setCurrentSrc(newSrc);
    }
  }, [videoState, currentSrc]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.load();
    el.play().catch(() => {
      // Autoplay may be blocked — silently ignore.
    });
  }, [currentSrc]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border/30 bg-surface/40 ${className ?? ""}`}
    >
      <video
        ref={videoRef}
        src={currentSrc}
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover"
      />
    </div>
  );
}
