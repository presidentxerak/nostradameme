import type {
  MarketRow,
  MarketSide,
  MarketSlot,
  MarketStatus,
  PositionRow,
  SupportedAssetRow,
} from "@/types/db";

export interface MarketPools {
  marketId: string;
  yesPool: number;
  noPool: number;
  totalVolume: number;
  yesPct: number;
  noPct: number;
  lastBetAt: string | null;
}

export interface LiveFeedEntry {
  id: string;
  userId: string;
  username: string;
  side: MarketSide;
  amount: number;
  createdAt: string;
}

export interface MarketWithAsset extends MarketRow {
  asset: SupportedAssetRow;
}

export interface MarketViewModel extends MarketWithAsset {
  pools: MarketPools;
  userPosition: PositionRow | null;
}

export interface OracleTitle {
  title: string;
  color: string;
  min: number;
  max: number;
}

export type OracleState =
  | "bullish"
  | "bearish"
  | "uncertain"
  | "balanced"
  | "dormant";

export interface UserStats {
  winRate: number;
  totalPredictions: number;
  totalWon: number;
  totalEarned: number;
  oracleTitle: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  winRate: number;
  totalEarned: number;
  totalPredictions: number;
  oracleTitle: string;
  isCurrentUser?: boolean;
}

export interface HistoryEntry {
  id: string;
  marketId: string;
  slot: MarketSlot;
  assetKey: string;
  question: string;
  side: MarketSide;
  amount: number;
  marketStatus: MarketStatus;
  resolutionSide: MarketSide | null;
  userWon: boolean | null;
  netPayout: number | null;
  createdAt: string;
  endAt: string;
}

export interface BetRequest {
  marketId: string;
  side: MarketSide;
  amount: number;
}

export interface BetResult {
  positionId: string;
  newBalance: number;
}

export interface DepositIntentResponse {
  intentId: string;
  widgetUrl: string;
  displayAmountUsd: number;
}

export type SlotKey = MarketSlot;
