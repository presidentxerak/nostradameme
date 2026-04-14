import { NextResponse, type NextRequest } from "next/server";

// Middleware runs in Edge Runtime which cannot import Zod-based lib/config/env.
// This is the one place where process.env is read directly.
function getBlockedCountries(): string[] {
  return (process.env.BLOCKED_COUNTRIES ?? "FR")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function middleware(req: NextRequest) {
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry");
  if (country && getBlockedCountries().includes(country.toUpperCase())) {
    if (req.nextUrl.pathname === "/blocked") return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/blocked";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|blocked).*)"],
};
