-- 0014_decouple_profiles_from_supabase_auth.sql
-- Remove the FK from profiles.id → auth.users(id) so that
-- profiles can be created for Privy-only users without
-- needing a corresponding Supabase auth row.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE profiles ADD PRIMARY KEY (id);
