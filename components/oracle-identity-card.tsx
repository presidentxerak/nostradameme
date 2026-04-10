"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { COPY } from "@/lib/config/copy";
import { formatUsd } from "@/lib/utils/currency";
import { avatarUrlFor } from "@/lib/utils/meme-names";

interface OracleIdentityCardProps {
  userId: string;
  username: string;
  oracleTitle: string;
  winRate: number;
  totalPredictions: number;
  totalEarned: number;
}

export function OracleIdentityCard({
  userId,
  username,
  oracleTitle,
  winRate,
  totalPredictions,
  totalEarned,
}: OracleIdentityCardProps) {
  const avatar = avatarUrlFor(userId);
  return (
    <Card className="border-accent/40 bg-gradient-to-br from-surface/90 to-background">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-accent/40 bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Image
            src={avatar}
            alt={username}
            width={64}
            height={64}
            unoptimized
          />
        </div>
        <div className="flex flex-col">
          <p className="font-mono text-lg text-text-primary">@{username}</p>
          <p className="text-sm text-accent-glow">{oracleTitle}</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            {COPY.profile.identity.winRate}
          </p>
          <p className="font-mono text-xl text-text-primary">
            {winRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            {COPY.profile.identity.predictions}
          </p>
          <p className="font-mono text-xl text-text-primary">
            {totalPredictions}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-3">
          <p className="text-[10px] uppercase tracking-widest text-text-muted">
            {COPY.profile.identity.earned}
          </p>
          <p className="font-mono text-xl text-gold-glow">
            {formatUsd(totalEarned)}
          </p>
        </div>
      </div>
    </Card>
  );
}
