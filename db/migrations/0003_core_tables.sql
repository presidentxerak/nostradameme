-- 0003_core_tables.sql
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  country_code text,
  role user_role_enum NOT NULL DEFAULT 'player',
  xrpl_address text UNIQUE,
  privy_user_id text UNIQUE,
  win_rate numeric(5,2) NOT NULL DEFAULT 0,
  total_predictions integer NOT NULL DEFAULT 0,
  total_won integer NOT NULL DEFAULT 0,
  total_earned numeric(20,6) NOT NULL DEFAULT 0,
  oracle_title text NOT NULL DEFAULT '🔮 Seeker',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notify_on_resolution boolean NOT NULL DEFAULT true,
  notify_on_new_market boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_legal_status (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  age_confirmed boolean NOT NULL DEFAULT false,
  real_money_eligible boolean NOT NULL DEFAULT false,
  terms_accepted_at timestamptz
);

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_mode text NOT NULL DEFAULT 'play_money',
  real_money_enabled boolean NOT NULL DEFAULT false,
  platform_fee_bps integer NOT NULL DEFAULT 500,
  last_checked_ledger_index bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jurisdictions (
  country_code text PRIMARY KEY,
  real_money_allowed boolean NOT NULL DEFAULT false
);

-- Seed a single app_settings row if empty.
INSERT INTO app_settings (app_mode, real_money_enabled, platform_fee_bps)
SELECT 'play_money', false, 500
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
