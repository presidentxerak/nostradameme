import { z } from "zod";

const urlOrDefault = (fallback: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : fallback));

const EnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Nostradameme"),
  NEXT_PUBLIC_APP_URL: urlOrDefault("http://localhost:3000"),

  NEXT_PUBLIC_SUPABASE_URL: urlOrDefault("http://localhost:54321"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  DATABASE_URL: z.string().default(""),

  NEXT_PUBLIC_PRIVY_APP_ID: z.string().default(""),
  PRIVY_APP_SECRET: z.string().default(""),

  NEXT_PUBLIC_TRANSAK_API_KEY: z.string().default(""),
  TRANSAK_SECRET_KEY: z.string().default(""),
  TRANSAK_ENV: z.enum(["staging", "production"]).default("staging"),

  XRPL_TREASURY_SEED: z.string().default(""),
  XRPL_TREASURY_ADDRESS: z.string().default(""),
  NEXT_PUBLIC_XRPL_TREASURY_ADDRESS: z.string().default(""),
  NEXT_PUBLIC_XAMAN_API_KEY: z.string().default(""),

  COINGECKO_API_KEY: z.string().default(""),
  COINGECKO_BASE_URL: urlOrDefault("https://api.coingecko.com/api/v3"),

  APP_MODE: z.enum(["play_money", "real_money"]).default("play_money"),
  REAL_MONEY_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  BLOCKED_COUNTRIES: z.string().default(""),
  CRON_SECRET: z.string().default(""),

  FEATURE_ENABLE_PAYOUTS: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  FEATURE_ENABLE_ONRAMP: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  RESEND_API_KEY: z.string().default(""),

  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_SUBJECT: z.string().default("mailto:hello@nostradameme.com"),

  NEXT_PUBLIC_SOLANA_NETWORK: z.string().default("mainnet-beta"),
  NEXT_PUBLIC_SOLANA_RPC_URL: z.string().default("https://api.mainnet-beta.solana.com"),
  NEXT_PUBLIC_SOLANA_TREASURY_ADDRESS: z.string().default(""),
  SOLANA_TREASURY_PRIVATE_KEY: z.string().default(""),
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
  NEXT_PUBLIC_XRPL_TREASURY_ADDRESS:
    process.env.NEXT_PUBLIC_XRPL_TREASURY_ADDRESS ??
    process.env.XRPL_TREASURY_ADDRESS,
  NEXT_PUBLIC_XAMAN_API_KEY: process.env.NEXT_PUBLIC_XAMAN_API_KEY,
  COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
  COINGECKO_BASE_URL: process.env.COINGECKO_BASE_URL,
  APP_MODE: process.env.APP_MODE,
  REAL_MONEY_ENABLED: process.env.REAL_MONEY_ENABLED,
  BLOCKED_COUNTRIES: process.env.BLOCKED_COUNTRIES,
  CRON_SECRET: process.env.CRON_SECRET,
  FEATURE_ENABLE_PAYOUTS: process.env.FEATURE_ENABLE_PAYOUTS,
  FEATURE_ENABLE_ONRAMP: process.env.FEATURE_ENABLE_ONRAMP,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  NEXT_PUBLIC_SOLANA_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_SOLANA_TREASURY_ADDRESS,
  SOLANA_TREASURY_PRIVATE_KEY: process.env.SOLANA_TREASURY_PRIVATE_KEY,
});

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment variables:", parsed.error.flatten());
}

export const env: Env = parsed.success
  ? parsed.data
  : (EnvSchema.parse({}) as Env);

// In production, fail loudly when critical secrets are missing rather than
// silently falling back to placeholder values that lead to runtime errors.
// Run only on the server to avoid bundling secret keys into the client check.
const isServer = typeof window === "undefined";
const isProd = process.env.NODE_ENV === "production";
const isBuild = process.env.NEXT_PHASE === "phase-production-build";
if (isServer && isProd && !isBuild) {
  const required: Array<keyof Env> = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "NEXT_PUBLIC_PRIVY_APP_ID",
    "PRIVY_APP_SECRET",
    "CRON_SECRET",
  ];
  const missing = required.filter((k) => !env[k] || String(env[k]).length === 0);
  if (env.REAL_MONEY_ENABLED) {
    if (!env.XRPL_TREASURY_SEED) missing.push("XRPL_TREASURY_SEED");
    if (!env.XRPL_TREASURY_ADDRESS) missing.push("XRPL_TREASURY_ADDRESS");
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in production: ${missing.join(", ")}`,
    );
  }
}

export function blockedCountries(): string[] {
  return env.BLOCKED_COUNTRIES.split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}
