import "server-only";

import { getMarketQuote } from "@/lib/oracle/quotes";
import { generateThreshold, roundThreshold } from "@/lib/markets/thresholds";
import { generateQuestion } from "@/lib/markets/questions";
import { slotStartUtc, slotEndUtc } from "@/lib/utils/dates";
import { generateMemeUsername } from "@/lib/utils/meme-names";
import { fnv1a } from "@/lib/utils/hash";
import type { MarketWithAsset, MarketPools, LiveFeedEntry } from "@/types/app";
import type { OraclePageSlotData } from "@/app/oracle-page-client";
import type { MarketSlot, SupportedAssetRow } from "@/types/db";

type SlotKey = "morning" | "noon" | "night";

const ASSETS: SupportedAssetRow[] = [
  {
    id: "demo-btc",
    asset_key: "BTC",
    asset_name: "Bitcoin",
    coingecko_id: "bitcoin",
    vs_currency: "usd",
    enabled: true,
    display_order: 1,
  },
  {
    id: "demo-eth",
    asset_key: "ETH",
    asset_name: "Ethereum",
    coingecko_id: "ethereum",
    vs_currency: "usd",
    enabled: true,
    display_order: 2,
  },
  {
    id: "demo-sol",
    asset_key: "SOL",
    asset_name: "Solana",
    coingecko_id: "solana",
    vs_currency: "usd",
    enabled: true,
    display_order: 3,
  },
];

const SLOT_ASSETS: Record<SlotKey, number> = {
  morning: 0,
  noon: 1,
  night: 2,
};

async function fetchSpotPrices(): Promise<Record<string, number>> {
  try {
    const ids = ASSETS.map((a) => a.coingecko_id).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { next: { revalidate: 30 } },
    );
    if (!res.ok) {
      console.warn("[demo] CoinGecko responded with", res.status);
      return {};
    }
    const data = (await res.json()) as Record<
      string,
      Record<string, number> | undefined
    >;
    const out: Record<string, number> = {};
    for (const a of ASSETS) {
      const price = data[a.coingecko_id]?.usd;
      if (typeof price === "number") out[a.coingecko_id] = price;
    }
    console.log("[demo] CoinGecko prices:", out);
    return out;
  } catch {
    return {};
  }
}

function buildDemoMarket(
  slot: SlotKey,
  asset: SupportedAssetRow,
  spotPrice: number,
  now: Date,
): MarketWithAsset {
  const startAt = slotStartUtc(slot, now);
  const endAt = slotEndUtc(slot, now);

  // If this slot already ended today, push to tomorrow.
  let start = startAt;
  let end = endAt;
  if (end.getTime() <= now.getTime()) {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    start = slotStartUtc(slot, tomorrow);
    end = slotEndUtc(slot, tomorrow);
  }

  const isOpen = now.getTime() >= start.getTime() && now.getTime() < end.getTime();

  const seed = (now.getUTCDate() + SLOT_ASSETS[slot]) / 10;
  const { thresholdPrice, operator } = generateThreshold(
    spotPrice,
    0.015,
    slot as MarketSlot,
    seed > 1 ? seed - Math.floor(seed) : seed,
  );

  const marketId = `demo-${slot}-${start.toISOString().slice(0, 10)}`;
  const question = generateQuestion(
    asset.asset_key,
    slot as MarketSlot,
    operator,
    thresholdPrice,
    end,
  );
  const oracleQuote = getMarketQuote(marketId);

  const yesPool = 120 + Math.floor(seed * 300);
  const noPool = 80 + Math.floor((1 - seed) * 200);

  return {
    id: marketId,
    slot: slot as MarketSlot,
    asset_id: asset.id,
    question,
    oracle_quote: oracleQuote,
    threshold_price: thresholdPrice,
    operator,
    opening_spot_price: spotPrice,
    closing_price: null,
    resolution_side: null,
    status: isOpen ? "open" : "draft",
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    source_snapshot: { demo: true, spotPrice },
    created_at: start.toISOString(),
    updated_at: start.toISOString(),
    asset,
  };
}

function buildDemoPools(market: MarketWithAsset): MarketPools {
  const seed =
    new Date(market.start_at).getUTCDate() +
    (market.slot === "morning" ? 0 : market.slot === "noon" ? 1 : 2);
  const yesPool = 120 + (seed % 5) * 60;
  const noPool = 80 + ((seed + 3) % 7) * 40;
  const total = yesPool + noPool;
  return {
    marketId: market.id,
    yesPool,
    noPool,
    totalVolume: total,
    yesPct: Math.round((yesPool / total) * 100),
    noPct: Math.round((noPool / total) * 100),
    lastBetAt: null,
  };
}

export async function generateDemoSlots(): Promise<OraclePageSlotData[]> {
  const prices = await fetchSpotPrices();
  const now = new Date();
  const slots: SlotKey[] = ["morning", "noon", "night"];

  return slots.map((slot) => {
    const assetIdx = SLOT_ASSETS[slot];
    const asset = ASSETS[assetIdx] ?? ASSETS[0]!;
    const spot = prices[asset.coingecko_id];
    if (!spot) {
      return {
        slot,
        market: null,
        pools: null,
        feed: [],
        userHasPosition: false,
        userPositionSide: null,
        userPositionAmount: null,
      };
    }
    const market = buildDemoMarket(slot, asset, spot, now);
    const pools = buildDemoPools(market);
    const feed = market.status === "open" ? buildDemoFeed(market.id, now) : [];
    return {
      slot,
      market,
      pools,
      feed,
      userHasPosition: false,
      userPositionSide: null,
      userPositionAmount: null,
    };
  });
}

function buildDemoFeed(marketId: string, now: Date): LiveFeedEntry[] {
  const entries: LiveFeedEntry[] = [];
  const amounts = [1, 5, 10, 25, 5, 10, 50, 25, 1, 5, 10, 100, 5, 25, 10];
  for (let i = 0; i < 15; i++) {
    const fakeUserId = `demo-user-${fnv1a(`${marketId}-${i}`)}`;
    const secsAgo = 10 + i * 45 + (fnv1a(`${i}-${marketId}`) % 60);
    entries.push({
      id: `demo-feed-${i}`,
      userId: fakeUserId,
      username: generateMemeUsername(fakeUserId),
      side: i % 3 === 0 ? "no" : "yes",
      amount: amounts[i] ?? 5,
      createdAt: new Date(now.getTime() - secsAgo * 1000).toISOString(),
    });
  }
  return entries;
}
