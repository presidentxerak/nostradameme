-- 0002_enums.sql
DO $$ BEGIN
  CREATE TYPE market_status_enum AS ENUM (
    'draft', 'open', 'locked', 'resolve_pending', 'resolved', 'canceled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE market_side_enum AS ENUM ('yes', 'no');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE market_slot_enum AS ENUM ('morning', 'noon', 'night', 'weekly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE deposit_status_enum AS ENUM (
    'pending', 'processing', 'confirmed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payout_status_enum AS ENUM (
    'pending', 'ready', 'processing', 'paid', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE xrpl_tx_status_enum AS ENUM (
    'pending', 'submitted', 'confirmed', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('player', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE run_status_enum AS ENUM (
    'started', 'succeeded', 'failed', 'skipped'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;
