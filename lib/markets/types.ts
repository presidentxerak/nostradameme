import type { MarketSide, MarketSlot } from "@/types/db";

export interface AssetProfile {
  id: string;
  assetKey: string;
  assetName: string;
  coingeckoId: string;
  vsCurrency: string;
}

export type Operator = "gte" | "lte";

export interface ThresholdInput {
  spotPrice: number;
  volatility: number;
  slot: MarketSlot;
}

export interface GeneratedMarket {
  slot: MarketSlot;
  assetId: string;
  question: string;
  oracleQuote: string;
  thresholdPrice: number;
  operator: Operator;
  openingSpotPrice: number;
  startAt: string;
  endAt: string;
  sourceSnapshot: Record<string, unknown>;
}

export interface ResolutionOutcome {
  closingPrice: number;
  resolutionSide: MarketSide;
}
