# The Studio — internal admin

Everything the house needs to run itself: stock, catalogue, orders, refunds,
enquiries. Served at **studio.folknfloret.com**.

---

## The decision, and why

**A separate subdomain: yes. A separate application: no.**

The subdomain is worth having. It gives the admin its own hostname to put
network-level protection in front of, its own `robots` policy, its own session
cookie, and a clean line in everyone's head between *the shop* and *the desk
behind the shop*.

A second Next.js app is not worth having. The studio needs the same Prisma
schema, the same `lib/order-state`, `lib/pricing`, `lib/money`, `lib/catalog`,
the same UI primitives and the same design tokens. A second app means either
copying all of that — where the copies drift, and a pricing rule fixed in one
place stays broken in the other — or extracting a shared package and running a
monorepo. For a house this size that is a large ongoing cost bought with a
small one-off benefit.

So: **one application, two hostnames.** Vercel points both at the same project;
middleware routes by `Host` and rewrites `studio.folknfloret.com/x` to the
`/studio/x` routes that already exist. One deploy, one schema, one set of
components, and the subdomain you actually wanted.

### The part that matters more than the subdomain

A subdomain with no extra protection is barely safer than a path — it is the
same code answering the same requests, just under a different name. What makes
it safer is what you put in front of it:

1. **Role check in the app.** Already there: `lib/staff.ts` refuses anyone who
   is not `STAFF` or `ADMIN`, and roles are only settable in the database.
2. **Host check.** `/studio/*` must 404 on the storefront host, so the admin
   exists at exactly one address.
3. **Network gate.** Vercel Deployment Protection, or Cloudflare Access with a
   Google-account allowlist, in front of `studio.` only. This is the one that
   turns a stolen session cookie from a breach into a nuisance.

Do all three. The third is a dashboard setting, not code, and it is the
cheapest security you will ever buy.

### The session wrinkle, worth knowing before you start

Session cookies are scoped to the host that set them. A session created on
`www.folknfloret.com` will not be sent to `studio.folknfloret.com`, so staff
will sign in twice — once for each. That is **good**: a stolen storefront
session cannot reach the studio.

It does mean `AUTH_URL` cannot stay pinned to one host. Auth.js with
`trustHost: true` and no `AUTH_URL` builds the callback per request, which is
what makes two hostnames work. Both callback URLs then need registering with
Google. See Phase S0.

---

## What already exists

Phase 8 built the beginnings, under `/studio`:

- The orders queue — paid orders, newest first.
- One order: contents, gift instructions, address, contact.
- Mark shipped with courier and AWB, mark delivered, both sending email.
- Full refund through Razorpay, returning stock.
- The printable packing slip, price-free on gift orders.

Everything below adds to that rather than replacing it.

---

## Phase S0 — The subdomain and the gate ✅ *code complete, awaiting DNS*

- [ ] **Yours:** add `studio.folknfloret.com` to the Vercel project and point
      DNS at it. Everything below is already deployed and waiting for it.
- [x] Middleware routes on `Host`. On `studio.*` it serves the studio from the
      root, so `studio.folknfloret.com/orders/FF-…` works; links written as
      `/studio/…` keep working too, so the same components serve both. On the
      storefront hosts `/studio/*` **404s**, so the admin exists at exactly one
      address.
- [x] `/account/*` still behind a session cookie.
- [x] The studio has its own route group and its own layout: no WebGL, no
      smooth scroll, **no cart drawer and no bag** — verified.
- [x] `robots: noindex, nofollow, nocache` on the whole group, plus
      `Disallow: /studio` in `robots.txt`.
- [ ] **Yours:** remove `AUTH_URL` and register the studio callback with
      Google. Do this *with* the DNS change, not before — see below.
- [ ] **Yours:** turn on a network gate for the subdomain only.

### Verified locally

`studio.localhost:3000` works as the studio host — browsers resolve any
`*.localhost` to loopback, so development exercises the same code path as
production rather than a special case.

| | |
|---|---|
| `localhost:3000/studio` | 404 |
| `studio.localhost:3000/` without a session | 307 → `/signin?callbackUrl=/` |
| `studio.localhost:3000/` as STAFF | the queue, in its own chrome |
| `studio.localhost:3000/orders/NOPE` | 404 |
| `studio.localhost:3000/api/auth/csrf` | 200 — staff must be able to sign in |

### The AUTH_URL change, in the right order

`AUTH_URL` is currently pinned to the apex. Auth.js builds its callback from
that, which is why sign-in works today — and why the studio host would fail if
you added it now: staff would be sent to `folknfloret.com/api/auth/callback/...`
and land back on the storefront with no studio session.

Removing `AUTH_URL` makes Auth.js derive the callback per host, which is what
two hostnames need. But it also changes the storefront's callback from the apex
to whichever host the visitor is on — almost always `www`. So:

1. Register **all three** redirect URIs with Google first:
   `https://folknfloret.com/...`, `https://www.folknfloret.com/...`,
   `https://studio.folknfloret.com/...`
2. Then remove `AUTH_URL` from Vercel.
3. Then `npm run check:oauth -- https://studio.folknfloret.com` and confirm
   what it prints matches what you registered.

Doing it the other way round breaks sign-in on the storefront.

---

## Phase S1 — Orders, finished

- [ ] Filter by status, date range and search by order number, email or phone.
- [ ] Pagination — the current list stops at 50.
- [ ] **Cancel an order.** Distinct from refunding: cancelling a `PENDING`
      order releases its hold; cancelling a `PAID` one must refund first. The
      state machine already forbids the illegal paths, so the UI only has to
      offer the legal ones.
- [ ] **Partial refunds.** Razorpay takes an amount; today the action sends the
      full total. A damaged single item in a five-piece suite is the normal
      case for this.
- [ ] Resend any email for an order — receipts get deleted and spam-filtered.
- [ ] Edit the shipping address before dispatch, keeping the original in the
      snapshot. Customers mistype PIN codes.
- [ ] Internal notes on an order, staff-only, never shown to the customer.
- [ ] Bulk print packing slips for the day's queue.

---

## Phase S2 — Inventory

The reason to build a studio at all: today stock is only editable in Prisma
Studio, which is a database client pointed at production.

- [ ] Stock list: every variant, on hand, reserved, available, sorted by
      scarcity.
- [ ] **Adjust stock with a reason** — received, damaged, counted, returned,
      written off. Never a bare editable number.
- [ ] `StockLedger` table. Every movement recorded: variant, delta, reason,
      who, when, and the order if there was one. Sales and refunds write to it
      too, so the ledger explains the number rather than merely restating it.
      *This is the one thing here that needs a migration, and it is worth it —
      "why do we have eleven when the shelf has nine" is unanswerable without
      it.*
- [ ] Low-stock view with a per-variant threshold.
- [ ] Bulk adjust after a physical count.

---

## Phase S3 — Catalogue

- [ ] Product list with status and stock at a glance.
- [ ] Create and edit a product: all the long-form fields the PDP renders.
- [ ] Variants: add, edit price and weight, reorder, retire.
- [ ] **Bundles**: pick component variants and quantities. Reject nesting, as
      `check-catalog` already does.
- [ ] Images: upload to blob storage, reorder, alt text required. Phase 3 of
      the marketplace roadmap covers where they live.
- [ ] Publish and archive. **Never delete** a product that has ever been
      ordered — `OrderItem` snapshots survive it, but the catalogue should keep
      its own history too.
- [ ] Collections: create, reorder, assign products.
- [ ] Every write calls `revalidateCatalog()`, which already exists.
- [ ] Run the same validations `scripts/check-catalog.mjs` runs, in the form —
      a price that is not a whole rupee is exactly as wrong typed in as seeded.

---

## Phase S4 — Discounts

- [ ] List codes with usage against limit.
- [ ] Create percent or fixed, minimum subtotal, usage cap, date window.
- [ ] Deactivate without deleting, so old orders still explain themselves.
- [ ] `usedCount` currently never increments — Phase 7 should have done it on
      payment. Fix it here and backfill.

---

## Phase S5 — Enquiries

D4 said bespoke commissions are quoted, not carted. The `Enquiry` table exists
and nothing writes to it yet.

- [ ] A public form on `/invitation` that creates an `Enquiry`.
- [ ] Inbox: list by status, open one, record a quote, move it through
      `NEW → IN_CONVERSATION → QUOTED → WON | LOST`.
- [ ] Email notification to the studio when one arrives.

---

## Phase S6 — Customers

- [ ] Search by email, name or phone.
- [ ] One customer: their orders, addresses, lifetime value.
- [ ] Change a role — the only way to make someone STAFF without a SQL client.
      **ADMIN only**, and never lets you remove your own last admin role.
- [ ] Export for email marketing, honouring `marketingOptIn`.

---

## Phase S7 — The desk

A single first screen worth opening:

- [ ] Orders awaiting dispatch, oldest first — the actual work queue.
- [ ] Anything stuck: `PENDING` past its hold, `PAYMENT_FAILED` today.
- [ ] Low stock, and any bundle blocked by a component.
- [ ] Today and this week: orders, revenue, average order value.
- [ ] Unread enquiries.

---

## Phase S8 — Accountability

- [ ] `AuditLog` table: actor, action, entity, before, after, when. Written by
      every studio mutation.
- [ ] Visible in the studio, filterable by person and entity.
- [ ] Confirmation on the irreversible ones — refunds, archiving, bulk stock.
- [ ] Rate-limit the studio's mutating actions, as sign-in already is.

Two people sharing a login and a price that changed on its own is a bad
afternoon. This makes it a five-minute question.

---

## Suggested order

**S0 → S2 → S1 → S3 → S8 → S4 → S5 → S6 → S7.**

S2 before S1 because inventory is the thing you cannot currently do at all,
where orders are merely unfinished. S8 lands early-ish because retrofitting an
audit log means the first months have no history.

S7 comes last on purpose: a dashboard is only worth building once you know
which numbers you actually reach for, and you will not know that until the
studio has been in daily use.

---

## What not to build

- **A second design system.** The studio uses the shop's tokens and primitives.
  It should look plainer, not different.
- **Your own auth.** Auth.js is already there; the studio is one more host.
- **Soft-delete everywhere.** Archive products and discount codes, because
  orders reference them. Enquiries and audit rows can be deleted outright.
- **A mobile-first studio.** It is used at a desk with a printer. Make it work
  on a phone for checking a number; do not design for it.
