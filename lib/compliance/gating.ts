import { env, blockedCountries } from "@/lib/config/env";

export interface GeoCheckResult {
  allowed: boolean;
  reason: string;
  countryCode: string | null;
}

export function detectCountry(req: Request): string | null {
  const headers = req.headers;
  const candidates = [
    headers.get("x-vercel-ip-country"),
    headers.get("cf-ipcountry"),
    headers.get("x-country-code"),
  ];
  for (const c of candidates) {
    if (c && c.length === 2) return c.toUpperCase();
  }
  return null;
}

export function checkGeoAccess(req: Request): GeoCheckResult {
  const country = detectCountry(req);
  const blocked = blockedCountries();
  if (!country) {
    return { allowed: true, reason: "unknown_country", countryCode: null };
  }
  if (blocked.includes(country)) {
    return {
      allowed: false,
      reason: `blocked_country:${country}`,
      countryCode: country,
    };
  }
  return { allowed: true, reason: "ok", countryCode: country };
}

export function realMoneyEnabled(): boolean {
  return env.REAL_MONEY_ENABLED && env.APP_MODE === "real_money";
}
