# Running the shop

How to change things, and what happens when you do. Written for the person who
owns the business rather than the person who wrote the code.

**One rule above all the others:** never put a real password, key or connection
string in `.env.example`. That file is committed to GitHub. Real values go in
`.env.local`, which is not. `npm run check:env` fails the moment something that
looks like a credential appears in the template — it has already caught a
database password and a Resend key.

---

## The map

| I want to change… | Edit | Then |
|---|---|---|
| Marketing page words — headlines, chapters, the footer | `lib/content.ts` | commit and push |
| Product names, descriptions, packaging copy, prices, stock | `prisma/seed-data.ts` | `npm run check:catalog` then `npm run db:seed` |
| Delivery charge or the free-delivery threshold | `lib/pricing.ts` | commit and push |
| A single price or stock count, right now | Prisma Studio (below) | nothing else |
| Product photographs | `public/placeholders/` for now — see Phase 3 of the roadmap | |
| Anything else | ask | |

Until the studio admin is built (see `STUDIO_ROADMAP.md`), the catalogue lives
in a file and reaches the database through the seed. That is deliberate: it
keeps every price change in git history, where you can see who changed what.

---

## Changing the catalogue

`prisma/seed-data.ts` holds every product. To change a price:

```ts
{ sku: "FF-CND-01", name: "No. 01 Sylvan Mist", priceInPaise: 145000, ... }
```

**Prices are in paise.** ₹1,450 is `145000`, not `1450`. Getting this wrong by
a factor of a hundred is the easiest and most expensive mistake available here,
so the checker refuses anything that is not a whole number of rupees.

```bash
npm run check:catalog   # validates before anything touches the database
npm run db:seed         # applies it
```

The seed is safe to run repeatedly. It matches on slug and SKU, so it updates
rather than duplicating — and it **deliberately does not overwrite stock**, so
re-seeding cannot undo a count you corrected by hand.

### What the checker catches

Duplicate slugs or SKUs, a bundle pointing at a component that does not exist,
a bundle inside a bundle, a price that is not whole rupees, a missing image,
a tax rate that looks wrong. It also prints each bundle against the sum of its
parts and flags any priced **below** its contents — worth reading, because two
currently are.

### Adding a new product

1. Add it to `prisma/seed-data.ts`, following the shape of one already there.
2. Give it a placeholder image: add the slug to `scripts/generate-placeholders.mjs`
   and to `lib/placeholders.ts`, then `node scripts/generate-placeholders.mjs`.
3. `npm run check:catalog && npm run db:seed`.
4. Commit and push.

---

## Changing one number without a deploy

For a stock correction after a physical count, or an urgent price change:

```bash
npm run db:studio
```

A database browser opens at localhost:5555. Find `ProductVariant`, edit
`priceInPaise` or `stockOnHand`, save.

**Two cautions.** This is production data with no undo and no record of who
changed it. And a change made here will be **overwritten by the next
`db:seed`** for prices (though not for stock). For anything you want to keep,
edit the seed file as well.

`stockReserved` is not yours to edit. Checkout manages it; a wrong value there
either hides stock you have or sells stock you do not.

---

## Environment variables

`.env.local` for your machine, Vercel → Settings → Environment Variables for
production. They are not shared — a variable added in one is absent from the
other, which is the usual reason something works locally and not live.

| Variable | Needed for | Notes |
|---|---|---|
| `DATABASE_URL` | everything | The **transaction pooler**, port 6543 |
| `DIRECT_URL` | migrations only | The **session pooler**, port 5432 |
| `AUTH_SECRET` | sign-in | Rotating it signs everyone out |
| `AUTH_RESEND_KEY`, `EMAIL_FROM` | emails, magic-link sign-in | Domain must be verified in Resend |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google sign-in | See `AUTH_SETUP.md` |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | payment | `rzp_test_…` until launch |
| `RAZORPAY_WEBHOOK_SECRET` | payment | A value you invent, in both Razorpay and Vercel |
| `NEXT_PUBLIC_SITE_URL` | share cards | Only once there is a custom domain |

Every one is optional except `DATABASE_URL`. Missing keys disable their
feature and say so, rather than breaking the site — no Razorpay key means the
pay button explains itself; no Resend key means sign-in is not offered.

**After changing a variable in Vercel, redeploy.** Vercel does not apply new
values to an already-built deployment.

---

## Deploying

Push to `v3/refined-form` and Vercel builds it. Before pushing:

```bash
npm run check:env && npm run check:catalog && npm run lint && npm run build
```

If the build fails on Vercel but works locally, it is almost always an
environment variable that exists on your machine and not in the project
settings.

The build does **not** need a database. Without one it still succeeds, prints a
loud `[catalog]` warning and serves every product page on demand — a slow site
rather than a failed deploy. If you see that warning in a deploy log,
`DATABASE_URL` is missing.

---

## Health checks

Run these against production whenever something feels wrong:

```bash
npm run db:check                                    # can the app reach Postgres
npm run check:webhook -- https://www.folknfloret.com # is Razorpay's endpoint reachable
npm run check:oauth  -- https://www.folknfloret.com  # what Google is actually being sent
```

`check:webhook` earns its place: a webhook pointed at the apex answers **308**,
Razorpay does not follow redirects, and every payment notification is silently
dropped. It must be `www`.

---

## Making someone staff

There is deliberately no way to grant yourself a role through the site. Open
`npm run db:studio`, find the person in `User`, set `role` to `STAFF` or
`ADMIN`, save. They can then reach `/studio`.

`ADMIN` is not yet distinguished from `STAFF` anywhere; the distinction exists
in the schema for when the admin gets destructive features.

---

## Things not to touch

- **`.env.example`** — the committed template. Placeholders only.
- **`lib/generated/`** — rebuilt by `npm run db:generate`. Never edit.
- **`prisma/migrations/`** — a record of what has already run. Add new ones
  with `npm run db:migrate`; never edit an applied one.
- **`stockReserved`** — see above.
- **`OrderItem` rows** — deliberately frozen copies of what was sold. Editing
  one rewrites history and the invoice with it.

---

## When something is wrong

| Symptom | Look at |
|---|---|
| Site up, product pages slow | `DATABASE_URL` missing in Vercel — check the deploy log for `[catalog]` |
| Orders stuck at PENDING | `npm run check:webhook`, then Razorpay → Webhooks → recent deliveries |
| Sign-in fails with `redirect_uri_mismatch` | `npm run check:oauth`, register exactly what it prints |
| Emails not arriving | Resend dashboard → Emails. If absent, `AUTH_RESEND_KEY` is missing |
| A price is wrong on the site but right in the file | The catalogue is cached for an hour; a deploy clears it |
| Everything is slow | Vercel functions and the database must be in the same region — `vercel.json` pins `sin1` |
