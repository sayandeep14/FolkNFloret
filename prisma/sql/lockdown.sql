-- Run after every migration that adds a table.
--   npm run db:lockdown
-- or paste into the Supabase SQL Editor.
--
-- Why this exists
-- ---------------
-- Supabase publishes every table in the `public` schema through PostgREST, and
-- the publishable/anon key that reaches it is public by design — it ships in
-- browser code. The only thing standing between that key and your data is
-- row-level security, and RLS is OFF by default on tables created outside the
-- Supabase dashboard. Prisma creates tables outside the dashboard.
--
-- So a Prisma schema pushed to Supabase and left alone is an open database:
-- anyone who reads the key out of your JavaScript can select every order,
-- every address and every phone number in it.
--
-- This app never uses PostgREST. It talks to Postgres directly over the
-- connection string, as the `postgres` role, which bypasses RLS. So turning
-- RLS on with no policies at all costs us nothing and denies everyone else.
--
-- Enumerated rather than listed by name so a table added by a future migration
-- cannot be forgotten — including Prisma's own _prisma_migrations, which
-- otherwise publishes the schema history.

DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', t.schemaname, t.tablename);
  END LOOP;
END $$;

-- Belt and braces: take the API roles' privileges away entirely, so a policy
-- added by accident later cannot open a table on its own.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- Verify: every row must read true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;
