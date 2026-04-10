export function formatUsd(
  amount: number,
  opts: { showSign?: boolean; decimals?: number } = {},
): string {
  const { showSign = false, decimals = 2 } = opts;
  const sign = amount < 0 ? "-" : showSign ? "+" : "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${sign}$${formatted}`;
}

export function formatUsdCompact(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return formatUsd(amount);
}

export function parseUsdInput(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function calculatePayoutEstimate(
  stake: number,
  sidePool: number,
  oppositePool: number,
  feeBps: number,
): number {
  if (stake <= 0) return 0;
  const newSidePool = sidePool + stake;
  const totalPool = newSidePool + oppositePool;
  const fee = (totalPool * feeBps) / 10000;
  const distributable = totalPool - fee;
  if (newSidePool <= 0) return 0;
  return (stake / newSidePool) * distributable;
}

export function calculatePct(part: number, whole: number): number {
  if (whole <= 0) return 50;
  return Math.round((part / whole) * 100);
}
