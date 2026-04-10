import "server-only";

import { env } from "@/lib/config/env";
import { AppError } from "@/lib/utils/errors";
import {
  SimplePriceSchema,
  MarketChartSchema,
  type MarketChart,
} from "@/lib/coingecko/schemas";

interface FetchOpts {
  signal?: AbortSignal;
}

async function cgFetch<T>(
  path: string,
  query: Record<string, string>,
  opts: FetchOpts = {},
): Promise<T> {
  const url = new URL(`${env.COINGECKO_BASE_URL}${path}`);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  const headers: Record<string, string> = {
    accept: "application/json",
  };
  if (env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = env.COINGECKO_API_KEY;
  }
  const res = await fetch(url.toString(), {
    headers,
    signal: opts.signal,
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new AppError(
      "coingecko_http_error",
      `CoinGecko ${res.status}`,
      502,
      { path },
    );
  }
  const json = (await res.json()) as T;
  return json;
}

export async function fetchSimplePrice(
  coingeckoIds: string[],
  vsCurrency = "usd",
): Promise<Record<string, number>> {
  if (coingeckoIds.length === 0) return {};
  const raw = await cgFetch<unknown>("/simple/price", {
    ids: coingeckoIds.join(","),
    vs_currencies: vsCurrency,
  });
  const parsed = SimplePriceSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError("coingecko_bad_response", parsed.error.message, 502);
  }
  const out: Record<string, number> = {};
  for (const id of coingeckoIds) {
    const entry = parsed.data[id];
    if (entry && typeof entry[vsCurrency] === "number") {
      out[id] = entry[vsCurrency];
    }
  }
  return out;
}

export async function fetchMarketChart(
  coingeckoId: string,
  days: number,
  vsCurrency = "usd",
): Promise<MarketChart> {
  const raw = await cgFetch<unknown>(
    `/coins/${encodeURIComponent(coingeckoId)}/market_chart`,
    {
      vs_currency: vsCurrency,
      days: days.toString(),
    },
  );
  const parsed = MarketChartSchema.safeParse(raw);
  if (!parsed.success) {
    throw new AppError("coingecko_bad_response", parsed.error.message, 502);
  }
  return parsed.data;
}
