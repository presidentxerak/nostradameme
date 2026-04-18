"use client";

interface CryptoIconProps {
  coingeckoId: string;
  size?: number;
  className?: string;
}

export function CryptoIcon({ coingeckoId, size = 24, className }: CryptoIconProps) {
  const url = `https://assets.coingecko.com/coins/images/${COIN_IMAGE_IDS[coingeckoId] ?? "1"}/small/${coingeckoId}.png`;
  return (
    <img
      src={url}
      alt={coingeckoId}
      width={size}
      height={size}
      className={`rounded-full ${className ?? ""}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

const COIN_IMAGE_IDS: Record<string, string> = {
  bitcoin: "1/large/bitcoin",
  ethereum: "279/large/ethereum",
  solana: "4128/large/solana",
};

export function CryptoIconUrl(coingeckoId: string): string {
  const path = COIN_IMAGE_IDS[coingeckoId];
  if (!path) return "";
  return `https://assets.coingecko.com/coins/images/${path}.png`;
}
