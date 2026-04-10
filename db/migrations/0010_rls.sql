-- 0010_rls.sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_legal_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supported_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_resolution_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_access_logs ENABLE ROW LEVEL SECURITY;

-- profiles: users read own, update basics; others can read public columns
DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- user_settings: read/update own
DROP POLICY IF EXISTS user_settings_own ON user_settings;
CREATE POLICY user_settings_own ON user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_legal_status: read own
DROP POLICY IF EXISTS user_legal_own ON user_legal_status;
CREATE POLICY user_legal_own ON user_legal_status
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- app_settings: public read
DROP POLICY IF EXISTS app_settings_public_read ON app_settings;
CREATE POLICY app_settings_public_read ON app_settings
  FOR SELECT USING (true);

-- jurisdictions: public read
DROP POLICY IF EXISTS jurisdictions_public_read ON jurisdictions;
CREATE POLICY jurisdictions_public_read ON jurisdictions
  FOR SELECT USING (true);

-- supported_assets: public read
DROP POLICY IF EXISTS supported_assets_public_read ON supported_assets;
CREATE POLICY supported_assets_public_read ON supported_assets
  FOR SELECT USING (true);

-- markets: public read
DROP POLICY IF EXISTS markets_public_read ON markets;
CREATE POLICY markets_public_read ON markets
  FOR SELECT USING (true);

-- positions: users read own only
DROP POLICY IF EXISTS positions_own_read ON positions;
CREATE POLICY positions_own_read ON positions
  FOR SELECT USING (auth.uid() = user_id);

-- positions: public aggregate read for pool calculation
DROP POLICY IF EXISTS positions_public_aggregate ON positions;
CREATE POLICY positions_public_aggregate ON positions
  FOR SELECT USING (funded = true);

-- internal_wallet_ledger: users read own only
DROP POLICY IF EXISTS ledger_own_read ON internal_wallet_ledger;
CREATE POLICY ledger_own_read ON internal_wallet_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- deposit_intents: users read own only
DROP POLICY IF EXISTS deposit_intents_own_read ON deposit_intents;
CREATE POLICY deposit_intents_own_read ON deposit_intents
  FOR SELECT USING (auth.uid() = user_id);

-- payouts: users read own only
DROP POLICY IF EXISTS payouts_own_read ON payouts;
CREATE POLICY payouts_own_read ON payouts
  FOR SELECT USING (auth.uid() = user_id);

-- leaderboard_snapshots: public read
DROP POLICY IF EXISTS leaderboard_public_read ON leaderboard_snapshots;
CREATE POLICY leaderboard_public_read ON leaderboard_snapshots
  FOR SELECT USING (true);

-- admin tables: admin role only
DROP POLICY IF EXISTS admin_users_admin_only ON admin_users;
CREATE POLICY admin_users_admin_only ON admin_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS admin_audit_logs_admin_only ON admin_audit_logs;
CREATE POLICY admin_audit_logs_admin_only ON admin_audit_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
