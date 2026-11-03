-- The migrations ledger (public._migrations) is the bookkeeping of
-- tools/apply-migrations.mjs, which runs as postgres and bypasses RLS.
-- The runner created it outside any migration, so it inherited the default
-- grants of the public schema: readable and writable through the REST API
-- with the public anon key. Supabase's security advisor flagged it
-- (rls_disabled_in_public, mail of 31.10.2026). Nothing in the app reads it.
-- Lock it: RLS on with no policies, and no API-role grants at all.
alter table public._migrations enable row level security;
revoke all on table public._migrations from anon, authenticated;
