-- 0013_push_subscriptions.sql
-- Stores Web Push subscriptions per user for browser/mobile notifications.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text UNIQUE NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user
  ON push_subscriptions(user_id);

-- Tracks which users were notified for which slot, to avoid duplicates.
CREATE TABLE IF NOT EXISTS market_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot market_slot_enum NOT NULL,
  slot_start_at timestamptz NOT NULL,
  channel text NOT NULL CHECK (channel IN ('push', 'email')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot, slot_start_at, channel)
);

CREATE INDEX IF NOT EXISTS idx_market_notifications_lookup
  ON market_notifications(slot, slot_start_at);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subs_own ON push_subscriptions;
CREATE POLICY push_subs_own ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS market_notifs_own_read ON market_notifications;
CREATE POLICY market_notifs_own_read ON market_notifications
  FOR SELECT USING (auth.uid() = user_id);
