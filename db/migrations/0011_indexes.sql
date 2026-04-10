-- 0011_indexes.sql
CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_market ON positions(market_id);
CREATE INDEX IF NOT EXISTS idx_positions_market_side_funded
  ON positions(market_id, side) WHERE funded = true;
CREATE INDEX IF NOT EXISTS idx_positions_created_at
  ON positions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_user ON internal_wallet_ledger(user_id);

CREATE INDEX IF NOT EXISTS idx_deposit_intents_user ON deposit_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_intents_tx
  ON deposit_intents(xrpl_tx_hash);
CREATE INDEX IF NOT EXISTS idx_deposit_intents_status
  ON deposit_intents(status);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_market ON payouts(market_id);

CREATE INDEX IF NOT EXISTS idx_markets_status ON markets(status);
CREATE INDEX IF NOT EXISTS idx_markets_open_end_at
  ON markets(end_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_markets_slot_status ON markets(slot, status);

CREATE INDEX IF NOT EXISTS idx_profiles_xrpl ON profiles(xrpl_address);

CREATE INDEX IF NOT EXISTS idx_leaderboard_lookup
  ON leaderboard_snapshots(period, period_start, rank);
