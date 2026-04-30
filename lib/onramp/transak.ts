import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { env } from "@/lib/config/env";
import { XRPL_CONFIG } from "@/lib/config/xrpl";

export const TransakOrderEventSchema = z.object({
  eventID: z.string(),
  webhookData: z.object({
    id: z.string(),
    status: z.string(),
    walletAddress: z.string().optional(),
    cryptoAmount: z.number().optional(),
    cryptoCurrency: z.string().optional(),
    fiatAmount: z.number().optional(),
    fiatCurrency: z.string().optional(),
    partnerOrderId: z.string().optional(),
  }),
});

export type TransakOrderEvent = z.infer<typeof TransakOrderEventSchema>;

export interface BuildWidgetUrlArgs {
  walletAddress: string;
  fiatAmount: number;
  partnerOrderId: string;
  email?: string | null;
}

export function buildTransakWidgetUrl(args: BuildWidgetUrlArgs): string {
  const base =
    env.TRANSAK_ENV === "production"
      ? "https://global.transak.com"
      : "https://global-stg.transak.com";
  const qs = new URLSearchParams();
  qs.set("apiKey", env.NEXT_PUBLIC_TRANSAK_API_KEY);
  qs.set("defaultCryptoCurrency", "RLUSD");
  qs.set("cryptoCurrencyCode", "RLUSD");
  qs.set("network", "xrpl");
  qs.set("walletAddress", args.walletAddress);
  qs.set("defaultFiatAmount", args.fiatAmount.toString());
  qs.set("fiatCurrency", "USD");
  qs.set("themeColor", "7c3aed");
  qs.set("partnerOrderId", args.partnerOrderId);
  qs.set("redirectURL", `${env.NEXT_PUBLIC_APP_URL}/profile?deposit=ok`);
  if (args.email) qs.set("email", args.email);
  return `${base}/?${qs.toString()}`;
}

export function validateDepositAmount(amountUsd: number): void {
  if (amountUsd < XRPL_CONFIG.MIN_DEPOSIT_USD) {
    throw new Error(`Minimum $${XRPL_CONFIG.MIN_DEPOSIT_USD}`);
  }
  if (amountUsd > 10000) {
    throw new Error("Maximum $10,000 per request");
  }
}

export function parseWebhookPayload(
  raw: unknown,
): TransakOrderEvent | null {
  const parsed = TransakOrderEventSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

/**
 * Verifies a Transak webhook signature.
 *
 * Transak signs webhooks with HS256 JWT using the partner's API secret.
 * The webhook body is `{ data: "<jwt-string>" }` and the JWT payload contains
 * the actual order event. We verify the JWT signature, decode the payload,
 * and return it (or null on failure).
 */
export interface VerifiedTransakBody {
  payload: unknown;
}

function base64UrlDecode(s: string): Buffer {
  const pad = (4 - (s.length % 4)) % 4;
  const b64 = (s + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

export function verifyTransakJwt(token: string): unknown | null {
  if (!env.TRANSAK_SECRET_KEY) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts as [string, string, string];

  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString("utf8"));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;

  const expected = createHmac("sha256", env.TRANSAK_SECRET_KEY)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  let provided: Buffer;
  try {
    provided = base64UrlDecode(sigB64);
  } catch {
    return null;
  }
  if (provided.length !== expected.length) return false ? false : null;
  let ok = false;
  try {
    ok = timingSafeEqual(expected, provided);
  } catch {
    ok = false;
  }
  if (!ok) return null;

  try {
    return JSON.parse(base64UrlDecode(payloadB64).toString("utf8"));
  } catch {
    return null;
  }
}
