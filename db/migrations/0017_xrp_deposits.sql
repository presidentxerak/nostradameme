-- 0017_xrp_deposits.sql
-- Adds XRP native deposit support (user sends XRP to treasury).

CREATE TABLE IF NOT EXISTS xrp_deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  xrp_address text NOT NULL,
  expected_xrp numeric(20,6) NOT NULL,
  xrp_price_usd numeric(20,6) NOT NULL,
  usd_amount numeric(20,6) NOT NULL,
  tx_hash text UNIQUE,
  status deposit_status_enum NOT NULL DEFAULT 'pending',
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xrp_deposits_user ON xrp_deposit_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_xrp_deposits_status ON xrp_deposit_intents(status);
CREATE INDEX IF NOT EXISTS idx_xrp_deposits_tx ON xrp_deposit_intents(tx_hash);

ALTER TABLE xrp_deposit_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY xrp_deposit_intents_service ON xrp_deposit_intents
  FOR ALL USING (true) WITH CHECK (true);
