import { env } from "@/lib/config/env";

export function buildShareUrl(marketId: string, ref?: string): string {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const url = `${base}/p/${encodeURIComponent(marketId)}`;
  return ref ? `${url}?ref=${encodeURIComponent(ref)}` : url;
}

export function buildOgImageUrl(params: {
  marketId: string;
  side?: "yes" | "no";
  username?: string;
  won?: boolean;
  amount?: number;
}): string {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const qs = new URLSearchParams();
  qs.set("marketId", params.marketId);
  if (params.side) qs.set("side", params.side);
  if (params.username) qs.set("username", params.username);
  if (params.won !== undefined) qs.set("won", params.won ? "1" : "0");
  if (params.amount !== undefined) qs.set("amount", params.amount.toFixed(2));
  return `${base}/api/og/prophecy?${qs.toString()}`;
}

export function buildTweetIntent(text: string, url: string): string {
  const qs = new URLSearchParams();
  qs.set("text", text);
  qs.set("url", url);
  return `https://twitter.com/intent/tweet?${qs.toString()}`;
}

export async function tryNativeShare(
  data: ShareData,
): Promise<"shared" | "cancelled" | "unsupported"> {
  if (typeof navigator === "undefined" || !("share" in navigator)) {
    return "unsupported";
  }
  try {
    await navigator.share(data);
    return "shared";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return "cancelled";
    return "cancelled";
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
