-- 0015_solana.sql
-- Adds Solana wallet support for deposits and withdrawals.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS solana_address text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'fiat';

CREATE TABLE IF NOT EXISTS sol_deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  solana_address text NOT NULL,
  expected_sol numeric(20,9) NOT NULL,
  sol_price_usd numeric(20,6) NOT NULL,
  usd_amount numeric(20,6) NOT NULL,
  tx_signature text UNIQUE,
  status deposit_status_enum NOT NULL DEFAULT 'pending',
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sol_deposits_user ON sol_deposit_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_sol_deposits_status ON sol_deposit_intents(status);
CREATE INDEX IF NOT EXISTS idx_sol_deposits_sig ON sol_deposit_intents(tx_signature);
CREATE INDEX IF NOT EXISTS idx_profiles_solana ON profiles(solana_address);
