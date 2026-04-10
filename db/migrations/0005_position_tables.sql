-- 0005_position_tables.sql
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  market_id uuid NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  side market_side_enum NOT NULL,
  amount numeric(20,6) NOT NULL CHECK (amount > 0),
  funded boolean NOT NULL DEFAULT false,
  funded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id)
);

CREATE TABLE IF NOT EXISTS internal_wallet_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_type text NOT NULL,
  amount numeric(20,6) NOT NULL,
  reference_type text NOT NULL,
  reference_id uuid,
  balance_after numeric(20,6) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
