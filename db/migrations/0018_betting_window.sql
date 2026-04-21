-- 0018_betting_window.sql
-- Separate betting window (20 min) from resolution time (24h to 1y).

ALTER TABLE markets ADD COLUMN IF NOT EXISTS betting_end_at timestamptz;
ALTER TABLE markets ADD COLUMN IF NOT EXISTS duration text;

-- Backfill existing markets: betting_end_at = end_at (old behavior)
UPDATE markets SET betting_end_at = end_at WHERE betting_end_at IS NULL;

-- For new markets, betting_end_at is NOT NULL
ALTER TABLE markets ALTER COLUMN betting_end_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_markets_betting_end ON markets(betting_end_at);
