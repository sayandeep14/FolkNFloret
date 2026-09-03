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

## 2. Copy the two connection strings

Open **Connect** in the top bar (older dashboards: **Project Settings →
Database → Connection string**). Choose the **URI** tab. You will see three
options; you need two of them.

| | Host | Port | Use it for |
|---|---|---|---|
| Direct connection | `db.<ref>.supabase.co` | 5432 | Nothing, unless you have IPv6. See below. |
| **Session pooler** | `...pooler.supabase.com` | 5432 | **`DIRECT_URL`** — migrations, seed, Studio |
| **Transaction pooler** | `...pooler.supabase.com` | 6543 | **`DATABASE_URL`** — the app |

Two things that trip people up here:

- **Direct connections are IPv6-only** on the free plan. Most home and office
  networks in India are IPv4-only, so a direct URL will simply time out.
  The session pooler is the IPv4 path to the same thing, which is why this
  guide uses it for migrations rather than the direct URL its name suggests.
- **The username differs.** Direct connections use `postgres`; both poolers use
  `postgres.<projectref>`. Copy the whole string rather than editing one.

Replace `[YOUR-PASSWORD]` in each string with the password from step 1. If the
password contains `@ : / ? # [ ] %`, percent-encode it — `@` becomes `%40` —
or the URL will parse wrongly and you will get an authentication error that
looks like a wrong password.

---

## 3. Put them in `.env.local`

```bash
cp .env.example .env.local
```

Then edit it so it reads roughly:

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

## 4. Apply the migration

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

**a. Turn RLS on for every table.** Open **SQL Editor → New query**, paste the
contents of [`prisma/sql/lockdown.sql`](../prisma/sql/lockdown.sql), and run
it. The final `SELECT` prints every table with its `rowsecurity` flag — all 17
must read `true`.

**b. Stop exposing the schema at all.** **Project Settings → API → Exposed
schemas**: remove `public`, leaving the list empty (or `graphql_public` alone).
Save.

Re-run (a) after any future migration that adds a table. Supabase's own
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
  constantly, so production must use the **transaction pooler** URL.
- `lib/generated/` is gitignored, so the build must run `prisma generate`
  first. Add it to the `build` script when you first deploy:
  `"build": "prisma generate && next build"`.
- Migrations in CI run `npm run db:deploy`, never `db:migrate` — the latter is
  interactive and can offer to reset the database.

---

## When it goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| `P1001: Can't reach database server` | Direct URL on an IPv4-only network | Use the session pooler URL (port 5432, `pooler.supabase.com`) |
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
