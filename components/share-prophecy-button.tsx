"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/config/copy";
import {
  buildShareUrl,
  buildTweetIntent,
  copyToClipboard,
  tryNativeShare,
} from "@/lib/utils/share";
import { formatUsd } from "@/lib/utils/currency";
import type { MarketSide } from "@/types/db";

interface ShareProphecyButtonProps {
  marketId: string;
  side: MarketSide;
  username: string;
  won?: boolean;
  amount?: number;
  marketQuestion?: string;
}

export function ShareProphecyButton({
  marketId,
  side,
  username,
  won,
  amount,
  marketQuestion,
}: ShareProphecyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [desktopFallback, setDesktopFallback] = useState(false);

  const url = buildShareUrl(marketId, username);
  const sideText = side === "yes" ? COPY.bet.yes : COPY.bet.no;
  const text =
    won && amount !== undefined
      ? COPY.share.textAfterWin(formatUsd(amount), url)
      : COPY.share.textAfterBet(
          marketQuestion ?? COPY.app.tagline,
          sideText,
          url,
        );

  const handleShare = async () => {
    const result = await tryNativeShare({
      title: COPY.share.title,
      text,
      url,
    });
    if (result === "unsupported") {
      setDesktopFallback(true);
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button onClick={handleShare} variant="gold" size="lg">
        {won ? COPY.share.buttonAfterWin : COPY.share.buttonAfterBet}
      </Button>
      {desktopFallback && (
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" size="sm">
            {copied ? COPY.share.copied : COPY.share.copy}
          </Button>
          <a
            href={buildTweetIntent(text, url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" asChild>
              <span>{COPY.share.tweet}</span>
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
