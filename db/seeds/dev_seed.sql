-- dev_seed.sql
-- Seeds a handful of markets for local development.
-- Run after migrations.

INSERT INTO jurisdictions (country_code, real_money_allowed) VALUES
  ('US', true),
  ('GB', true),
  ('DE', true),
  ('FR', false)
ON CONFLICT DO NOTHING;

WITH asset AS (
  SELECT id FROM supported_assets WHERE asset_key = 'BTC' LIMIT 1
)
INSERT INTO markets (
  slot, asset_id, question, oracle_quote,
  threshold_price, operator, opening_spot_price,
  status, start_at, end_at
)
SELECT
  'morning',
  asset.id,
  'Will BTC close above $82,000 by dawn tomorrow?',
  'The ancient scroll whispers of a green candle...',
  82000, 'gte', 81200,
  'open',
  now(),
  now() + interval '24 hours'
FROM asset
ON CONFLICT DO NOTHING;
