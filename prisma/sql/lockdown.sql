-- Run this in the Supabase SQL Editor AFTER `npm run db:deploy`.
-- Re-run it after any migration that adds a table.
--
-- Why this exists
-- ---------------
-- Supabase publishes every table in the `public` schema through PostgREST, and
-- the anon key that reaches it is public by design — it ships in browser code.
-- The only thing standing between that key and your data is row-level
-- security, and RLS is OFF by default on tables created outside the Supabase
-- dashboard. Prisma creates tables outside the dashboard.
--
-- So a Prisma schema pushed to Supabase and left alone is an open database:
-- anyone who reads the anon key out of your JavaScript can select every order,
-- every address and every phone number in it.
--
-- This app never uses PostgREST. It talks to Postgres directly over the
-- connection string, as the `postgres` role, which bypasses RLS. So turning
-- RLS on with no policies at all costs us nothing and denies everyone else.

ALTER TABLE "Product"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BundleComponent"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Collection"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductCollection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WebhookEvent"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipment"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DiscountCode"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enquiry"           ENABLE ROW LEVEL SECURITY;

-- Belt and braces: take the API roles' privileges away entirely, so a future
-- policy added by accident cannot open a table on its own.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- Verify: every row must show rowsecurity = true.
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;
