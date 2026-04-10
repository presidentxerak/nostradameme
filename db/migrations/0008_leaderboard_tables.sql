-- 0008_leaderboard_tables.sql
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL CHECK (period IN ('all_time', 'weekly', 'daily')),
  period_start date NOT NULL,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank integer NOT NULL,
  win_rate numeric(5,2) NOT NULL,
  total_earned numeric(20,6) NOT NULL,
  total_predictions integer NOT NULL,
  oracle_title text NOT NULL,
  username text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (period, period_start, user_id)
);
