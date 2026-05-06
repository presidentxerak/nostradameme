import { NextResponse, type NextRequest } from "next/server";

// Countries that ban or heavily restrict online crypto betting/gambling.
// Sources: FATF, local gambling/crypto regulations as of 2026.
const BLOCKED_COUNTRIES = new Set([
  "US", // United States — state-by-state, federally restricted
  "CN", // China — crypto + gambling banned
  "IN", // India — crypto betting restricted
  "KP", // North Korea — OFAC sanctioned
  "IR", // Iran — OFAC sanctioned
  "SY", // Syria — OFAC sanctioned
  "CU", // Cuba — OFAC sanctioned
  "RU", // Russia — crypto gambling banned
  "BY", // Belarus
  "MM", // Myanmar — sanctioned
  "AF", // Afghanistan — crypto banned
  "IQ", // Iraq — gambling illegal
  "LY", // Libya — sanctioned
  "SD", // Sudan — sanctioned
  "SO", // Somalia
  "YE", // Yemen
  "VE", // Venezuela — sanctions
  "PK", // Pakistan — crypto betting illegal
  "BD", // Bangladesh — crypto banned
  "NP", // Nepal — crypto banned
  "DZ", // Algeria — crypto banned
  "MA", // Morocco — crypto banned
  "EG", // Egypt — crypto restricted
  "TN", // Tunisia — crypto banned
  "QA", // Qatar — gambling illegal
  "SA", // Saudi Arabia — gambling illegal
  "KW", // Kuwait — gambling illegal
  "BH", // Bahrain — gambling restricted
  "OM", // Oman — gambling illegal
  "JO", // Jordan — gambling illegal
  "LB", // Lebanon — gambling restricted
  "AE", // UAE — gambling illegal (except licensed)
  "VN", // Vietnam — crypto gambling banned
  "ID", // Indonesia — gambling + crypto restricted
  "TH", // Thailand — gambling illegal
  "LA", // Laos — gambling restricted
  "KH", // Cambodia — online gambling banned
  "ZW", // Zimbabwe — crypto restricted
  "ET", // Ethiopia — gambling restricted
  "TZ", // Tanzania — crypto restricted
  "BO", // Bolivia — crypto banned
  "EC", // Ecuador — crypto restricted
  "TR", // Turkey — crypto payments banned
]);

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

  // Geo-blocking: redirect blocked countries to /blocked page.
  if (pathname !== "/blocked" && !pathname.startsWith("/api/cron/") && !pathname.startsWith("/_next/") && pathname !== "/terms" && pathname !== "/privacy" && pathname !== "/contact") {
    const country = (
      req.headers.get("x-vercel-ip-country") ??
      req.headers.get("cf-ipcountry") ??
      ""
    ).toUpperCase();
    if (country && BLOCKED_COUNTRIES.has(country)) {
      return NextResponse.redirect(new URL("/blocked", req.url));
    }
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
