import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Nostradameme"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("http://localhost:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default("anon-key-placeholder"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default("service-role-placeholder"),
  DATABASE_URL: z.string().default("postgres://user:pass@localhost:5432/nostradameme"),

  NEXT_PUBLIC_PRIVY_APP_ID: z.string().default("privy-app-id-placeholder"),
  PRIVY_APP_SECRET: z.string().default("privy-secret-placeholder"),

  NEXT_PUBLIC_TRANSAK_API_KEY: z.string().default("transak-api-placeholder"),
  TRANSAK_SECRET_KEY: z.string().default("transak-secret-placeholder"),
  TRANSAK_ENV: z.enum(["staging", "production"]).default("staging"),

  XRPL_TREASURY_SEED: z.string().default("sEdV1LAxqRZ1x2YhLNKtZ5dY8zKpB9S"),
  XRPL_TREASURY_ADDRESS: z
    .string()
    .default("rTreasuryPlaceholderAddressFake00"),

  COINGECKO_API_KEY: z.string().default(""),
  COINGECKO_BASE_URL: z
    .string()
    .url()
    .default("https://api.coingecko.com/api/v3"),

  APP_MODE: z.enum(["play_money", "real_money"]).default("play_money"),
  REAL_MONEY_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  BLOCKED_COUNTRIES: z.string().default(""),
  CRON_SECRET: z.string().default("local-cron-secret"),

  FEATURE_ENABLE_PAYOUTS: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  FEATURE_ENABLE_ONRAMP: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  RESEND_API_KEY: z.string().default(""),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  PRIVY_APP_SECRET: process.env.PRIVY_APP_SECRET,
  NEXT_PUBLIC_TRANSAK_API_KEY: process.env.NEXT_PUBLIC_TRANSAK_API_KEY,
  TRANSAK_SECRET_KEY: process.env.TRANSAK_SECRET_KEY,
  TRANSAK_ENV: process.env.TRANSAK_ENV,
  XRPL_TREASURY_SEED: process.env.XRPL_TREASURY_SEED,
  XRPL_TREASURY_ADDRESS: process.env.XRPL_TREASURY_ADDRESS,
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
  COINGECKO_BASE_URL: process.env.COINGECKO_BASE_URL,
  APP_MODE: process.env.APP_MODE,
  REAL_MONEY_ENABLED: process.env.REAL_MONEY_ENABLED,
  BLOCKED_COUNTRIES: process.env.BLOCKED_COUNTRIES,
  CRON_SECRET: process.env.CRON_SECRET,
  FEATURE_ENABLE_PAYOUTS: process.env.FEATURE_ENABLE_PAYOUTS,
  FEATURE_ENABLE_ONRAMP: process.env.FEATURE_ENABLE_ONRAMP,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
});

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment variables:", parsed.error.flatten());
  throw new Error("Invalid environment variables");
}

export const env: Env = parsed.data;

export function blockedCountries(): string[] {
  return env.BLOCKED_COUNTRIES.split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}
