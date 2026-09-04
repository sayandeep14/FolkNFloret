# Supabase setup

Getting a database under Folks & Florets, from nothing to a seeded catalogue.
Fifteen minutes, most of it waiting for the project to provision.

**Step 6 is not optional.** Supabase publishes `public` schema tables through a
REST API guarded only by row-level security, and RLS is off by default on
tables Prisma creates. Skipping it leaves every order and address in the
database readable by anyone who views your JavaScript source.

The dashboard's wording moves around between releases. Where this guide names a
menu item and you cannot find it, the value is the thing to look for, not the
label.

---

## 1. Create the project

1. Sign in at **supabase.com/dashboard** and choose **New project**.
2. **Name:** `folks-and-florets`.
3. **Database password:** let the dashboard generate one, then put it straight
   in a password manager. It is shown once. Recovering from losing it means
   resetting the database password, which invalidates every connection string
   you have already pasted anywhere.
4. **Region:** **South Asia (Mumbai)** — `ap-south-1`. Buyers, studio and
   deployment are all in India; a US region adds 200ms to every query for
   nothing.
5. **Plan:** Free is fine to build on. Two things to know before launch: a free
   project **pauses after 7 days with no activity** and needs a manual resume,
   and backup retention is minimal. Move to Pro before you take real money —
   that is a Phase 11 item, not a today item.

Provisioning takes a couple of minutes.

---

## 2. Copy the connection string

Open **Connect** in the top bar (older dashboards: **Project Settings →
Database → Connection string**), and choose the **URI** tab.

**Start with whichever string you can see.** Most dashboards show a *Direct
connection* most prominently, and that is enough for everything up to
deployment — building locally opens a handful of connections, which is exactly
what a direct connection is for.

```
postgresql://postgres:[YOUR-PASSWORD]@db.<projectref>.supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with the password from step 1. If it contains
`@ : / ? # [ ] %`, percent-encode it — `@` becomes `%40` — or the URL parses
wrongly and you get an authentication error that looks like a wrong password.

### If the direct connection will not connect

Supabase direct connections are **IPv6-only** on the free plan. If your network
has no IPv6 route out, the host resolves but never answers. `npm run db:check`
(step 4) tests for this and tells you which case you are in.

The fix is a **pooler** URL, which is IPv4-friendly. In the same **Connect**
modal, scroll past the direct connection — the poolers are listed below it. If
you cannot see them there, try **Project Settings → Database → Connection
pooling**.

| | Host | Port | Username | Use for |
|---|---|---|---|---|
| Direct | `db.<ref>.supabase.co` | 5432 | `postgres` | Local work, if you have IPv6 |
| Session pooler | `...pooler.supabase.com` | 5432 | `postgres.<ref>` | `DIRECT_URL` — migrations |
| Transaction pooler | `...pooler.supabase.com` | 6543 | `postgres.<ref>` | `DATABASE_URL` — serverless |

Note the username differs between them: direct connections use `postgres`,
both poolers use `postgres.<projectref>`. Copy the whole string rather than
editing one into another.

### When you actually need the poolers

At deployment, not before. Vercel is serverless and opens a connection per
invocation, which exhausts a direct connection's limit quickly — so production
must use the transaction pooler. That is a Phase 11 concern; today, one URL is
fine.

## 3. Put them in `.env.local`

```bash
cp .env.example .env.local
```

Starting out, one URL does for both jobs:

```
DATABASE_URL="postgresql://postgres:PASSWORD@db.abcdefgh.supabase.co:5432/postgres"
```

`DIRECT_URL` is optional and falls back to `DATABASE_URL`. Set it only once
`DATABASE_URL` points at a **transaction pooler** (port 6543), which will be at
deployment:

```
DATABASE_URL="postgresql://postgres.abcdefgh:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.abcdefgh:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

`.env.local` is gitignored. Keep it that way — a connection string is a
credential, and this one has no second factor in front of it.

Why two URLs: DDL cannot go through a transaction pooler, which hands out a
different backend per statement. Prisma's migration lock is a Postgres advisory
lock, and an advisory lock taken on one connection is not held on the next.
`prisma.config.ts` reads `DIRECT_URL` for migrations; `lib/db.ts` reads
`DATABASE_URL` for the app.

---

## 4. Check the connection, then apply the migration

```bash
npm run db:check        # what each URL points at, and whether it answers
```

It names the fault rather than the symptom — a hostname that does not resolve,
an IPv6-only host on an IPv4 network, a paused project, a pooler URL with the
wrong username, an unencoded password. Get a clean run before going further;
a bad URL surfaces as a migration that hangs, which is a slower way to learn
the same thing.

```bash
npm run db:generate     # build the Prisma client from the schema
npm run db:deploy       # create the 17 tables
```

Expect `17 migrations found` … no — expect `1 migration found in
prisma/migrations` and `Applying migration 20260904000000_init`.

Verify in the dashboard under **Table Editor**: `Product`, `ProductVariant`,
`Order` and thirteen others should be listed, all empty.

---

## 5. Seed the catalogue

```bash
npm run check:catalog   # validates the data before it touches the database
npm run db:seed
```

Expected output:

```
collections: 4
products: 19, variants: 25
bundle components: 22
```

The seed is idempotent — running it twice will not duplicate anything, and it
deliberately does not overwrite `stockOnHand`, so a re-seed cannot undo
inventory counts the studio has adjusted.

Look at it with `npm run db:studio`, or in the Supabase Table Editor.

---

## 6. Close the API. Do not skip this.

Supabase runs PostgREST over the `public` schema and hands out an **anon key**
to reach it. That key is public by design — it ships inside browser
JavaScript. The only thing protecting a table from it is row-level security,
and **RLS is off by default on tables created outside the Supabase dashboard**,
which is every table Prisma just made.

Left as is, `Customer`, `Address`, `Order` and `Payment` are readable — and
writable — by anyone who opens devtools on your site.

This app never uses PostgREST. It connects to Postgres directly as the
`postgres` role, which bypasses RLS entirely. So denying everyone else costs
nothing.

**Do both of these:**

**a. Turn RLS on for every table.**

```bash
npm run db:lockdown
```

It applies [`prisma/sql/lockdown.sql`](../prisma/sql/lockdown.sql) and prints
how many tables are protected — it must say every one of them. The SQL
enumerates the schema rather than listing tables by name, so a table added by
a later migration cannot be forgotten. You can also paste the file into the
Supabase **SQL Editor** if you prefer to watch it run.

**b. Stop exposing the schema at all.** **Project Settings → API → Exposed
schemas**: remove `public`, leaving the list empty (or `graphql_public` alone).
Save.

Re-run `npm run db:lockdown` after any future migration that adds a table. Supabase's own
Advisors panel will also flag an unprotected table under **Security**, which is
a useful backstop.

---

## 7. Confirm it works end to end

```bash
npm run db:studio
```

Open `Product`, confirm 19 rows, and confirm `ProductVariant` has 25 with
`priceInPaise` in paise — the signature candle should read `145000`, not
`1450`. If it reads `1450`, something has divided by a hundred and that is
worth stopping to find.

---

## 8. Later: deployment and CI

Not needed today; noted so it is not a surprise in Phase 11.

- Vercel: set `DATABASE_URL` and `DIRECT_URL` under **Settings → Environment
  Variables** for Production and Preview. Vercel is serverless and reconnects
  constantly, so production must use the **transaction pooler** URL (port
  6543); `DIRECT_URL` is the session pooler (5432) and is only used by
  migrations.
- `lib/generated/` is gitignored, so the build runs `prisma generate` first —
  already wired into the `build` script.
- **The build does not require a database.** `prisma generate` needs only the
  schema, `lib/db.ts` builds its client on first use rather than on import,
  and `safeSlugs` catches a failed catalogue read. A build without
  `DATABASE_URL` therefore succeeds and prints a loud `[catalog]` warning,
  prerendering nothing and serving every product page on demand. That is a
  working site, not a broken one — but it is slow, so read the warning.
- Migrations in CI run `npm run db:deploy`, never `db:migrate` — the latter is
  interactive and can offer to reset the database.
- Set `NEXT_PUBLIC_SITE_URL` once there is a custom domain. Until then the
  origin is inferred from `VERCEL_URL`, which keeps preview share cards
  pointing at the preview rather than at production.

---

## When it goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| `Can't reach database server`, host does not resolve | Wrong project reference, or the project is still provisioning | Compare the ref against the dashboard URL: `.../project/<REF>`. Wait a minute if it is new. |
| `P1001: Can't reach database server`, host resolves | Direct URL on an IPv4-only network | Use the session pooler URL (port 5432, `pooler.supabase.com`) |
| `Tenant or user not found` | Pooler URL with username `postgres` | Pooler needs `postgres.<projectref>`; re-copy the whole string |
| `password authentication failed` but the password is right | Unencoded special character in the URL | Percent-encode it: `@` → `%40`, `#` → `%23` |
| `prepared statement "s0" already exists` | Transaction pooler used for migrations | That is what `DIRECT_URL` is for — check it is set and on port 5432 |
| Migration hangs, then times out | Advisory lock cannot be held across a transaction pooler | Same as above |
| Everything worked, now nothing connects | Free project auto-paused after 7 days idle | Resume it from the dashboard |
| `Environment variable not found: DATABASE_URL` | `.env.local` missing or misnamed | `cp .env.example .env.local` and fill it in |

---

## What this does not cover

Supabase Auth. This project uses **Auth.js** (roadmap Phase 5) against our own
`Customer` table, so Supabase is a Postgres host here and nothing more. If you
would rather use Supabase Auth, say so before Phase 5 — it changes the schema
and it is much cheaper to decide now than to migrate later.
