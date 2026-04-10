-- 0012_views.sql
CREATE OR REPLACE VIEW market_pools AS
SELECT
  m.id AS market_id,
  COALESCE(SUM(p.amount) FILTER (WHERE p.side = 'yes' AND p.funded), 0)::numeric(20,6)
    AS yes_pool,
  COALESCE(SUM(p.amount) FILTER (WHERE p.side = 'no' AND p.funded), 0)::numeric(20,6)
    AS no_pool,
  COALESCE(SUM(p.amount) FILTER (WHERE p.funded), 0)::numeric(20,6)
    AS total_volume,
  MAX(p.created_at) FILTER (WHERE p.funded) AS last_bet_at
FROM markets m
LEFT JOIN positions p ON p.market_id = m.id
GROUP BY m.id;

CREATE OR REPLACE VIEW user_balance AS
SELECT
  user_id,
  COALESCE(SUM(amount), 0)::numeric(20,6) AS balance
FROM internal_wallet_ledger
GROUP BY user_id;

CREATE OR REPLACE VIEW user_portfolio AS
SELECT
  p.id AS position_id,
  p.user_id,
  p.market_id,
  p.side,
  p.amount,
  p.created_at,
  m.slot,
  m.question,
  m.status AS market_status,
  m.end_at,
  m.resolution_side,
  m.asset_id,
  po.net_amount AS payout_net,
  po.status AS payout_status
FROM positions p
INNER JOIN markets m ON m.id = p.market_id
LEFT JOIN payouts po ON po.position_id = p.id;
