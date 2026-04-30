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

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMITS: Record<string, number> = {
  "/api/positions/create": 10,
  "/api/sol/deposit": 5,
  "/api/xrp/deposit": 5,
  "/api/deposits/create-intent": 5,
  "/api/me": 20,
  "/api/auth/sync": 10,
  "/api/push/subscribe": 10,
  "/api/push/unsubscribe": 10,
};
const DEFAULT_RATE_LIMIT = 60;

const ipCounts = new Map<string, { count: number; resetAt: number }>();

function getRateLimit(pathname: string): number {
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(prefix)) return limit;
  }
  return DEFAULT_RATE_LIMIT;
}

function checkRateLimit(ip: string, pathname: string): boolean {
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = ipCounts.get(key);
  if (!entry || now > entry.resetAt) {
    ipCounts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= getRateLimit(pathname);
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

  // Geo-gating: block disallowed countries from accessing the app and from
  // making real-money API calls. Always allow the /blocked page itself,
  // /api/health (for monitoring), and static-like assets.
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

  if (pathname.startsWith("/api/")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (!pathname.startsWith("/api/cron/") && !checkRateLimit(ip, pathname)) {
      return NextResponse.json(
        { error: { code: "rate_limited", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    const origin = req.headers.get("origin") ?? "";
    const response = NextResponse.next();

    if (ALLOWED_ORIGINS.has(origin) || origin.endsWith(".vercel.app")) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
