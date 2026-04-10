-- 0007_payout_tables.sql
CREATE TABLE IF NOT EXISTS payout_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  status run_status_enum NOT NULL DEFAULT 'started',
  yes_pool numeric(20,6) NOT NULL DEFAULT 0,
  no_pool numeric(20,6) NOT NULL DEFAULT 0,
  platform_fee numeric(20,6) NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_run_id uuid NOT NULL REFERENCES payout_runs(id) ON DELETE CASCADE,
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position_id uuid NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  gross_amount numeric(20,6) NOT NULL,
  fee_amount numeric(20,6) NOT NULL DEFAULT 0,
  net_amount numeric(20,6) NOT NULL,
  status payout_status_enum NOT NULL DEFAULT 'pending',
  xrpl_tx_hash text UNIQUE,
  xrpl_tx_status xrpl_tx_status_enum NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
