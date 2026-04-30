-- 0020_rate_limit_buckets.sql
-- Persistent rate limiter backed by Postgres. Replaces the in-memory
-- Map in middleware.ts which is ineffective in serverless.

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_reset_at_idx
  ON rate_limit_buckets (reset_at);

-- Atomic increment: returns the post-increment count for the bucket.
-- Resets the bucket if the previous window has elapsed.
CREATE OR REPLACE FUNCTION rate_limit_hit(
  p_key text,
  p_window_seconds integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO rate_limit_buckets (key, count, reset_at, updated_at)
  VALUES (
    p_key,
    1,
    now() + make_interval(secs => p_window_seconds),
    now()
  )
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limit_buckets.reset_at < now() THEN 1
      ELSE rate_limit_buckets.count + 1
    END,
    reset_at = CASE
      WHEN rate_limit_buckets.reset_at < now()
        THEN now() + make_interval(secs => p_window_seconds)
      ELSE rate_limit_buckets.reset_at
    END,
    updated_at = now()
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;
