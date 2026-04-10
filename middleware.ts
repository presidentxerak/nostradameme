import { NextResponse, type NextRequest } from "next/server";
import { blockedCountries } from "@/lib/config/env";

export function middleware(req: NextRequest) {
  const country =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry");
  if (country && blockedCountries().includes(country.toUpperCase())) {
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
