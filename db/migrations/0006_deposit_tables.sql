-- 0006_deposit_tables.sql
CREATE TABLE IF NOT EXISTS deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_amount_usd numeric(10,2) NOT NULL CHECK (display_amount_usd > 0),
  rlusd_amount numeric(20,6) NOT NULL CHECK (rlusd_amount > 0),
  status deposit_status_enum NOT NULL DEFAULT 'pending',
  transak_order_id text UNIQUE,
  xrpl_tx_hash text UNIQUE,
  xrpl_ledger_index bigint,
  credited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
