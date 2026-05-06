import { NextResponse, type NextRequest } from "next/server";

// Countries where binary options / crypto prediction markets / crypto gambling
// are illegal or require a license we don't hold.
// Sources: ESMA, FCA, CFTC, ASIC, CSA, FATF, national regulators (2025-2026).
const BLOCKED_COUNTRIES = new Set([
  // --- OFAC sanctioned ---
  "US", // United States — CFTC requires registration for prediction markets
  "KP", // North Korea
  "IR", // Iran
  "SY", // Syria
  "CU", // Cuba
  "RU", // Russia
  "BY", // Belarus
  "MM", // Myanmar
  "LY", // Libya
  "SD", // Sudan
  "SS", // South Sudan
  "SO", // Somalia
  "YE", // Yemen
  "VE", // Venezuela
  "NI", // Nicaragua
  "CF", // Central African Republic
  "CD", // DR Congo
  // --- EU — ESMA binary options ban (all 27 member states) ---
  "AT", // Austria
  "BE", // Belgium — Polymarket fully blocked
  "BG", // Bulgaria
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France — ANJ actively blocking prediction markets
  "DE", // Germany — GGL classified as illegal gambling
  "GR", // Greece
  "HU", // Hungary — nationwide block on prediction markets
  "IE", // Ireland
  "IT", // Italy — treated as unlicensed gambling
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands — Kansspelautoriteit ordered shutdown
  "PL", // Poland — restricted
  "PT", // Portugal — regulator ordered shutdown
  "RO", // Romania — ONJN blacklisted prediction markets
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  // --- EEA (ESMA binary options ban extends) ---
  "IS", // Iceland
  "LI", // Liechtenstein
  "NO", // Norway
  // --- UK + Commonwealth with binary options ban ---
  "GB", // United Kingdom — FCA binary options ban + gambling licence required
  "AU", // Australia — ASIC binary options ban + ACMA blocked prediction markets
  "CA", // Canada — CSA binary options ban
  "NZ", // New Zealand — FMA binary options restrictions
  // --- Asia-Pacific — prediction markets illegal ---
  "CN", // China — crypto + gambling banned
  "JP", // Japan — criminal gambling framework
  "KR", // South Korea — prediction market betting illegal
  "SG", // Singapore — GRA blocked prediction markets
  "IN", // India — online betting banned since 2025
  "VN", // Vietnam — crypto gambling banned
  "ID", // Indonesia — gambling + crypto restricted
  "TH", // Thailand — gambling illegal, Polymarket blocked
  "KH", // Cambodia — online gambling banned
  "LA", // Laos
  "PK", // Pakistan — crypto betting illegal
  "BD", // Bangladesh — crypto banned
  "NP", // Nepal — crypto banned
  // --- Middle East — gambling illegal ---
  "SA", // Saudi Arabia
  "QA", // Qatar
  "KW", // Kuwait
  "AE", // UAE
  "BH", // Bahrain
  "OM", // Oman
  "JO", // Jordan
  "LB", // Lebanon
  "IQ", // Iraq
  // --- Africa — crypto/gambling bans ---
  "DZ", // Algeria — crypto banned
  "MA", // Morocco — crypto banned
  "EG", // Egypt — crypto restricted
  "TN", // Tunisia — crypto banned
  "ET", // Ethiopia
  "TZ", // Tanzania
  "ZW", // Zimbabwe
  // --- Americas ---
  "BO", // Bolivia — crypto banned
  "EC", // Ecuador
  // --- Other ---
  "TR", // Turkey — crypto payments banned
  "IL", // Israel — binary options completely banned
  "CH", // Switzerland — prediction markets restricted
  "AF", // Afghanistan — crypto banned
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
