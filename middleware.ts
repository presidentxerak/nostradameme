import { NextResponse, type NextRequest } from "next/server";

const BLOCKED_COUNTRY_LIST = (process.env.BLOCKED_COUNTRIES ?? "")
  .split(",")
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean);

const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-country-code",
];

function detectCountry(req: NextRequest): string | null {
  for (const h of COUNTRY_HEADERS) {
    const v = req.headers.get(h);
    if (v && v.length === 2) return v.toUpperCase();
  }
  return null;
}

function isCountryBlocked(req: NextRequest): boolean {
  if (BLOCKED_COUNTRY_LIST.length === 0) return false;
  const country = detectCountry(req);
  if (!country) return false;
  return BLOCKED_COUNTRY_LIST.includes(country);
}

const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

const ALLOWED_ORIGINS = new Set([
  "https://nostradameme.com",
  "https://www.nostradameme.com",
]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Geo-gating: block disallowed countries. Exempt the /blocked page itself,
  // /api/health, /_next assets, and crons (Vercel cron has no geo header).
  const geoExempt =
    pathname.startsWith("/blocked") ||
    pathname === "/api/health" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/cron/");
  if (!geoExempt && isCountryBlocked(req)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "blocked_country", message: "Service unavailable in your region" } },
        { status: 451 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/blocked";
    return NextResponse.redirect(url);
  }

  // Per-route rate limiting is enforced inside Node.js API handlers via
  // lib/auth/rate-limit.ts (Postgres-backed). The middleware runs on the
  // edge runtime which can't access our service-role Supabase client, so
  // it stays focused on geo + headers.
  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin") ?? "";
    const response = NextResponse.next();

    if (ALLOWED_ORIGINS.has(origin) || origin.endsWith(".vercel.app")) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, DELETE, OPTIONS",
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
      response.headers.set("Access-Control-Max-Age", "86400");
    }

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }

    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|mp4|webm|ico)).*)"],
};
