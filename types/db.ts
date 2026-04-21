export type MarketStatus =
  | "draft"
  | "open"
  | "locked"
  | "resolve_pending"
  | "resolved"
  | "canceled";

export type MarketSide = "yes" | "no";

export type MarketSlot = "morning" | "noon" | "night" | "weekly";

export type DepositStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "failed";

export type PayoutStatus =
  | "pending"
  | "ready"
  | "processing"
  | "paid"
  | "failed";

export type XrplTxStatus =
  | "pending"
  | "submitted"
  | "confirmed"
  | "failed";

export type UserRole = "player" | "admin";

export type RunStatus = "started" | "succeeded" | "failed" | "skipped";

export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  country_code: string | null;
  role: UserRole;
  xrpl_address: string | null;
  privy_user_id: string | null;
  solana_address: string | null;
  payment_mode: string;
  win_rate: number;
  total_predictions: number;
  total_won: number;
  total_earned: number;
  oracle_title: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsRow {
  user_id: string;
  notify_on_resolution: boolean;
  notify_on_new_market: boolean;
  updated_at: string;
}

export interface UserLegalStatusRow {
  user_id: string;
  age_confirmed: boolean;
  real_money_eligible: boolean;
  terms_accepted_at: string | null;
}

export interface AppSettingsRow {
  id: string;
  app_mode: "play_money" | "real_money";
  real_money_enabled: boolean;
  platform_fee_bps: number;
  last_checked_ledger_index: number;
  updated_at: string;
}

export interface JurisdictionRow {
  country_code: string;
  real_money_allowed: boolean;
}

export interface SupportedAssetRow {
  id: string;
  asset_key: string;
  asset_name: string;
  coingecko_id: string;
  vs_currency: string;
  enabled: boolean;
  display_order: number;
}

export interface MarketRow {
  id: string;
  slot: MarketSlot;
  asset_id: string;
  question: string;
  oracle_quote: string;
  threshold_price: number;
  operator: "gte" | "lte";
  opening_spot_price: number;
  closing_price: number | null;
  resolution_side: MarketSide | null;
  status: MarketStatus;
  start_at: string;
  end_at: string;
  source_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MarketGenerationRunRow {
  id: string;
  market_id: string | null;
  status: RunStatus;
  trigger_source: string;
  request_id: string | null;
  error_message: string | null;
  details: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
}

export interface MarketResolutionRunRow {
  id: string;
  market_id: string;
  status: RunStatus;
  closing_price: number | null;
  resolution_side: MarketSide | null;
  error_message: string | null;
  details: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
}

export interface PositionRow {
  id: string;
  user_id: string;
  market_id: string;
  side: MarketSide;
  amount: number;
  funded: boolean;
  funded_at: string | null;
  created_at: string;
}

export interface InternalWalletLedgerRow {
  id: string;
  user_id: string;
  entry_type: string;
  amount: number;
  reference_type: string;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

export interface DepositIntentRow {
  id: string;
  user_id: string;
  display_amount_usd: number;
  rlusd_amount: number;
  status: DepositStatus;
  transak_order_id: string | null;
  xrpl_tx_hash: string | null;
  xrpl_ledger_index: number | null;
  credited_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface XrpDepositIntentRow {
  id: string;
  user_id: string;
  xrp_address: string;
  expected_xrp: number;
  xrp_price_usd: number;
  usd_amount: number;
  tx_hash: string | null;
  status: DepositStatus;
  credited_at: string | null;
  created_at: string;
}

export interface PayoutRunRow {
  id: string;
  market_id: string;
  status: RunStatus;
  yes_pool: number;
  no_pool: number;
  platform_fee: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface PayoutRow {
  id: string;
  payout_run_id: string;
  market_id: string;
  user_id: string;
  position_id: string;
  gross_amount: number;
  fee_amount: number;
  net_amount: number;
  status: PayoutStatus;
  xrpl_tx_hash: string | null;
  xrpl_tx_status: XrplTxStatus;
  paid_at: string | null;
  created_at: string;
}

export interface LeaderboardSnapshotRow {
  id: string;
  period: "all_time" | "weekly" | "daily";
  period_start: string;
  user_id: string;
  rank: number;
  win_rate: number;
  total_earned: number;
  total_predictions: number;
  oracle_title: string;
  username: string;
  updated_at: string;
}

export interface WebhookEventRow {
  id: string;
  provider: string;
  external_event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  created_at: string;
}
