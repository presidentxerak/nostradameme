import "server-only";

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
