-- 0004_market_tables.sql
CREATE TABLE IF NOT EXISTS supported_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key text UNIQUE NOT NULL,
  asset_name text NOT NULL,
  coingecko_id text NOT NULL,
  vs_currency text NOT NULL DEFAULT 'usd',
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0
);

INSERT INTO supported_assets (asset_key, asset_name, coingecko_id, display_order)
VALUES
  ('BTC', 'Bitcoin', 'bitcoin', 1),
  ('ETH', 'Ethereum', 'ethereum', 2),
  ('SOL', 'Solana', 'solana', 3)
ON CONFLICT (asset_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot market_slot_enum NOT NULL,
  asset_id uuid NOT NULL REFERENCES supported_assets(id),
  question text NOT NULL,
  oracle_quote text NOT NULL,
  threshold_price numeric(20,6) NOT NULL,
  operator text NOT NULL CHECK (operator IN ('gte', 'lte')),
  opening_spot_price numeric(20,6) NOT NULL,
  closing_price numeric(20,6),
  resolution_side market_side_enum,
  status market_status_enum NOT NULL DEFAULT 'draft',
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  source_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slot, start_at)
);

CREATE TABLE IF NOT EXISTS market_generation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid REFERENCES markets(id) ON DELETE SET NULL,
  status run_status_enum NOT NULL DEFAULT 'started',
  trigger_source text NOT NULL,
  request_id text,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE TABLE IF NOT EXISTS market_resolution_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  status run_status_enum NOT NULL DEFAULT 'started',
  closing_price numeric(20,6),
  resolution_side market_side_enum,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
