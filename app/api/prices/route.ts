import { NextResponse } from "next/server";
import { fetchSimplePrice } from "@/lib/coingecko/client";
import { handleApiError } from "@/lib/auth/guards";
import { AppError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_IDS = new Set([
  "solana",
  "ripple",
  "bitcoin",
  "ethereum",
]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && ALLOWED_IDS.has(s));
    if (ids.length === 0) {
      throw new AppError("bad_request", "No valid ids", 400);
    }
    const prices = await fetchSimplePrice(ids);
    return NextResponse.json(
      { prices },
      {
        headers: {
          "cache-control": "public, max-age=20, s-maxage=20",
        },
      },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
