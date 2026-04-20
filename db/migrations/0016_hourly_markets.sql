-- 0016_hourly_markets.sql
-- Switch from UNIQUE(slot, start_at) to UNIQUE(start_at) to support
-- 24 hourly markets per day (1 market per hour, any slot name).

ALTER TABLE markets DROP CONSTRAINT IF EXISTS markets_slot_start_at_key;

-- One market per start time (hourly granularity).
CREATE UNIQUE INDEX IF NOT EXISTS idx_markets_unique_start
  ON markets(start_at);
