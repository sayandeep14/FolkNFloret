# Folks & Florets — Marketplace Build Roadmap

Turning the current site into a shop that takes money.

Work top to bottom. Each phase ends in something demonstrable, and nothing in a
phase depends on a later one. Tick items as they land.

---

## Where we are starting from

What exists today is a **single-page marketing site**, not an application:

- Next.js 16 App Router, React 19, TypeScript. One route (`/`), fully static.
- All copy is hard-coded in `lib/content.ts`. There is no database, no server
  code, no API route, no user, no session, no order.
- A full-screen fixed WebGL canvas (`components/canvas/`) runs behind the whole
  document, plus Lenis smooth scroll and several pinned GSAP ScrollTriggers.

That last point is the single most important constraint in this document, and
Phase 0 exists entirely because of it. **The canvas and Lenis must not run on
shop pages.** Reasons, in order of severity:

1. A checkout page that also renders 280 instanced petals and a post-processing
   chain will drop frames on a mid-range Android while someone is trying to pay.
2. Lenis hijacks scrolling. It fights native form behaviour, `scrollIntoView`
   on validation errors, and the browser's own focus scrolling.
3. Pinned ScrollTriggers assume a page whose height never changes. A cart whose
   rows can be removed changes height constantly.

So the shop is not "more sections on the existing page." It is a second
experience that shares the design system and the header, and nothing else.

---

## Decisions to make before Phase 1

**All settled — see the answers column.** These shaped the Phase 1 schema.

| # | Question | Decision |
|---|---|---|
| D1 | Do we hold real stock, or make to order? | **Track stock.** Candles and honey are batch goods; overselling a hamper you cannot assemble is the worst failure mode in gifting. |
| D2 | Guest checkout, or accounts required? | **Guest checkout, with an optional account at the end.** Forcing signup before a first purchase is the largest single drop-off in Indian D2C. |
| D3 | Are hampers products, or baskets of products? | **Bundle products with a component list.** A suite has its own price, photo and packaging — it is not the sum of its parts — but stock must decrement for every component. |
| D4 | How are bespoke commissions handled? | **Enquiry, not checkout.** They are quoted individually. A form that creates a lead, not a cart item. |
| D5 | Payment provider | **Razorpay.** Prices are in ₹, the buyer is in India, and it covers UPI, cards, netbanking and wallets in one integration. Stripe's India support for domestic-only businesses is not worth the friction. |
| D6 | Do we offer Cash on Delivery? | **No, at least at launch.** COD on a ₹14,000 keepsake trunk is a returns liability, and it breaks the prepaid-only assumption that keeps Phase 7 simple. |
| D7 | Who fulfils and ships? | **An aggregator** (Shiprocket / Delhivery). The `Shipment` model names its provider rather than assuming one, so switching aggregators is config, not a migration. |

---

## Phase 0 — Foundations ✅ *complete*

Restructure so commerce can be added without dragging the WebGL along.
**No user-visible change on the marketing page. This is the phase people skip
and regret.**

- [x] Split routes into groups: `app/(marketing)/` for the current page,
      `app/(shop)/` for everything new. Each group has its own `layout.tsx`.
- [x] Move `SceneMount`, `SmoothScroll`, `Cursor` and `EpilogueTracker` out of
      the shared root and into the **marketing layout only**.
- [x] Verify: shop routes create no WebGL context, add no `lenis` class, mount
      no custom cursor, and `window.scrollTo` moves `scrollY` synchronously.
      Checked on `/shop`, `/cart` and `/account`; the marketing page still has
      all three.
- [x] Extract the design tokens into `app/tokens.css`, imported at the root.
- [x] Extract the shared furniture into `app/chrome.css` — header, menu,
      footer, `.shell`, and the typographic and button primitives — so the shop
      wears the same clothes without importing the journey's layout rules.
      `app/globals.css` is now marketing-only and is imported by that group's
      layout; `app/shop.css` is imported by the shop's.
- [x] `SiteHeader` takes a `variant`: the floating liquid-glass capsule on
      marketing, a solid alabaster bar on shop routes. Section links become
      absolute (`/#collections`) in the solid variant, or they resolve to
      nothing from a shop URL.
- [x] Account and bag affordances in the header, on both variants. Inert —
      the bag badge arrives with Phase 4.
- [x] Shop UI primitives: `Button`, `ButtonLink`, `Field`, `Input`, `Textarea`,
      `Select`, `Money`, `Badge`, `Breadcrumb`, `EmptyState`, `Skeleton`,
      `PlaceholderImage`.
- [x] `lib/money.ts` is the only place currency is formatted, and it takes
      paise. `<Money paise={145000} />`, never rupees, so a price cannot be
      rendered a hundred times too small.
- [x] `error.tsx`, `not-found.tsx` for the shop group and `loading.tsx` for
      `/shop`.
- [x] Placeholder product imagery (see Phase 3).

**Landed:** `/shop` shows a preview grid of eight cards, `/cart` and `/account`
show branded empty states. The product array in `app/(shop)/shop/page.tsx` is
deliberately the shape the real query will return, so Phase 2 replaces the
array and nothing else.

**Known gap:** the shop's colour scheme is defined on `.shop` in `shop.css` and
the header's solid variant is styled there too. If a shop route is ever
rendered outside that wrapper the header will fall back to cream-on-dark.

---

## Phase 1 — Data model and database ✅ *schema complete, awaiting a database*

- [ ] **Provision Postgres.** The one step I could not do: a Postgres is
      running on this machine at `localhost:5432` but it wants a password, and
      guessing at your credentials is not something to do unasked. Either
      create a **Neon** or **Supabase** project, or make a local database, then
      put the URL in `.env.local` (see `.env.example`).
- [x] Prisma added and pinned to **7.10.0**. Note `prisma@latest` currently
      resolves to `8.0.0-rc.12` — npm's `latest` tag is pointing at a release
      candidate, so the versions are pinned exactly rather than floating.
- [x] Schema modelled: 17 tables, 8 enums, 29 indexes, 17 foreign keys.
      Verified by compiling it to Postgres DDL with `prisma migrate diff`.
- [x] **Snapshot rule** enforced in the schema. `OrderItem` carries
      `titleSnapshot`, `variantSnapshot`, `skuSnapshot`, `hsnSnapshot`,
      `imageSnapshot`, `unitPriceInPaise` and `taxRateBps`, and its variant
      relation is `onDelete: SetNull` — an order survives its product being
      archived.
- [x] **Money rule** enforced. Every amount is `Int` paise. `lib/money.ts` is
      the only formatter, and `scripts/check-catalog.mjs` fails the build on a
      price that is not a whole number of rupees, which is what a rupee figure
      written into a paise column looks like.
- [x] **Stock rule** enforced. `stockOnHand` and `stockReserved` are separate
      columns on `ProductVariant`.
- [x] Seed written from `fnf.md`: 4 collections, 19 products, 25 variants,
      6 bundles. Idempotent — upserts by slug and SKU, and deliberately does
      *not* overwrite `stockOnHand` on re-run, so a re-seed cannot undo the
      studio's inventory counts.
- [x] Variants: candles × 3 fragrances, honey × 3 varietals, nuts × 2
      varieties, moss bowl × 2 bases.
- [x] Bundles: three duos and three suites, each with a component list.
      Nesting is rejected by the checker — a bundle inside a bundle would make
      stock reservation recursive for no commercial reason.
- [x] `scripts/check-catalog.mjs` validates the catalogue **without a
      database**: duplicate slugs and SKUs, unresolvable bundle components,
      nested bundles, non-positive prices and weights, unmapped images,
      implausible tax rates. Runs as `npm run check:catalog`.

### Bringing the database up

```bash
cp .env.example .env.local          # then fill in DATABASE_URL
npm run db:deploy                   # apply prisma/migrations
npm run db:seed                     # load the catalogue
npm run db:studio                   # eyeball it
```

`npm run db:generate` regenerates the client; `lib/generated/` is gitignored,
so CI must run it before typechecking.

### Two things that need a human

**Prices.** `fnf.md` quotes *suggested* retail, as ranges, and only for some
lines. Everything else is interpolated and marked `// Provisional` in
`prisma/seed-data.ts`. The checker prints each bundle against the sum of its
parts, and two currently come out **below** it:

| Bundle | Price | Sum of parts | |
|---|---|---|---|
| The Tea & Honey Cellar Duo | ₹2,900 | ₹3,150 | −8% |
| The Biophilic Sanctuary Chest | ₹8,500 | ₹9,700 | −12% |

A hamper discount is a legitimate offer, so this is a warning and not an
error. But both cases come from component prices *I* interpolated, not from
`fnf.md` — most likely the brass care suite and the herbarium frame are priced
too high. Correcting the components is probably right; discounting the chest
deliberately is also fine. It needs a decision, not a guess.

**GST rates.** `taxRateBps` is set per product from a best reading of HSN
classification. It is not tax advice, and composite gift hampers are a
genuinely contested classification — every rate needs the accountant's
confirmation before the first invoice.

### The schema, in brief

```
Product        id, slug, title, latin, house, subtitle, description,
               careNotes, status(draft|active|archived), isBundle,
               seoTitle, seoDescription
ProductVariant id, productId, sku, name, priceInPaise, compareAtPaise,
               weightGrams, stockOnHand, stockReserved, position
BundleItem     bundleVariantId, componentVariantId, quantity
ProductImage   id, productId, url, alt, width, height, position
Collection     id, slug, title, description        -- Aromatics, Epicurean, Preserved
ProductCollection  productId, collectionId, position
Customer       id, email(unique), name, phone, createdAt
Address        id, customerId, name, line1, line2, city, state, pincode,
               phone, isDefault
Cart           id, customerId?, token(unique), status, expiresAt
CartItem       id, cartId, variantId, quantity, unitPriceInPaise
Order          id, orderNumber(unique), customerId?, email, status,
               subtotal, shipping, tax, discount, total,   -- all paise
               shippingAddress(json snapshot), billingAddress(json snapshot),
               placedAt
OrderItem      id, orderId, variantId, titleSnapshot, unitPriceInPaise,
               quantity, taxRateBps
Payment        id, orderId, provider, providerOrderId, providerPaymentId,
               status, amountInPaise, rawPayload(json)
Shipment       id, orderId, carrier, awb, status, shippedAt, deliveredAt
DiscountCode   code, type(percent|fixed), value, minSubtotal, usageLimit,
               usedCount, startsAt, endsAt
Enquiry        id, name, email, phone, occasion, budget, message, status
```

---

## Phase 2 — Product catalog

- [ ] `app/(shop)/shop/page.tsx` — all products, filterable by collection.
- [ ] `app/(shop)/collections/[slug]/page.tsx` — Aromatics, Epicurean,
      Preserved, The Suites.
- [ ] `app/(shop)/products/[slug]/page.tsx` — the PDP.
- [ ] `ProductCard`: image, title, latin name, from-price, house.
- [ ] PDP contents, in this order: gallery, title + latin, price, variant
      selector, quantity, add to cart, then the long-form sections — what it is,
      the packaging architecture, materials and dimensions, care, delivery.
      **The packaging detail in `fnf.md` is the differentiator; give it real
      estate, not a collapsed accordion at the bottom.**
- [ ] Out-of-stock and low-stock states on both card and PDP.
- [ ] Bundle PDPs list their components with links.
- [ ] Sorting: featured, price ascending, price descending, newest.
- [ ] `generateStaticParams` + ISR (`revalidate`) so catalog pages are static
      and fast; revalidate on admin write via `revalidateTag`.
- [ ] `generateMetadata` per product, plus Open Graph images.
- [ ] JSON-LD `Product` + `Offer` structured data.

**Done when:** every item in `fnf.md` is browsable at a real URL with a real
price, and Lighthouse SEO is ≥ 95 on a PDP.

---

## Phase 3 — Product photography and media

Blocking for Phase 2 to look like anything. **There are still no product
photographs in this repo** — `assets/ref/` holds mood references only.

- [x] Stand-in imagery so a catalogue page reads as the brand rather than as a
      wireframe: `scripts/generate-placeholders.mjs` draws one pressed-specimen
      plate per SKU in the house palette, into `public/placeholders/`. Re-run
      the script after adding a slug, and register it in `lib/placeholders.ts`.
      `PlaceholderImage` already sets the 4:5 ratio, `sizes` and alt text a
      real photograph will need, so the swap is a change of `src`.

- [ ] Shot list per SKU: hero on stone, three-quarter with lid off, scale/detail
      macro, the packaging closed, the packaging open, one styled lifestyle.
- [ ] Consistent art direction: warm alabaster ground, single soft key from the
      left, brass and oak reading warm, no colour cast fights. The site is a
      near-black room — product images must not arrive as a colour riot, which
      is the exact failure that killed the earlier photoreal direction.
- [ ] Storage: Vercel Blob, Cloudinary or S3 + CloudFront. Not the repo.
- [ ] Serve through `next/image` with `sizes` set; AVIF/WebP; explicit
      dimensions to hold layout.
- [ ] Alt text for every image, written as description not keyword soup.

---

## Phase 4 — Cart

- [ ] Cart identity: signed HTTP-only cookie holding a cart token. Same cart
      works for guests and, after login, merges into the customer's cart.
- [ ] Server actions: `addItem`, `updateQuantity`, `removeItem`, `applyDiscount`.
- [ ] **Re-price on the server every read.** Never trust a price sent from the
      client. The client sends a variant id and a quantity, nothing more.
- [ ] Validate stock on add and again at checkout.
- [ ] Cart drawer (slide-over) plus a full `/cart` page for small screens.
- [ ] Optimistic UI with `useOptimistic`, reconciled against the server result.
- [ ] Order summary component: subtotal, shipping, GST, discount, total —
      shared verbatim between cart, checkout and the order confirmation, so the
      three can never disagree.
- [ ] Empty state that routes back into the collections.

**Done when:** items survive a page reload and a browser restart, and editing a
product's price in the database changes the cart total on next load.

---

## Phase 5 — Customer accounts

- [ ] **Auth.js v5** (NextAuth) with the Prisma adapter. Clerk is the faster
      route if you would rather not own auth at all — decide once, it is
      expensive to swap.
- [ ] Sign-in methods: **email magic link** as the primary (no passwords to
      leak, no reset flow to build) and **Google** as the convenience option.
      Add phone OTP later if the audience demands it.
- [ ] `/account` — order history.
- [ ] `/account/orders/[orderNumber]` — a single order with its shipment status.
- [ ] `/account/addresses` — address book, CRUD, one default.
- [ ] `/account/profile` — name, phone, email preferences.
- [ ] Middleware protecting `/account/*`; redirect to sign-in with a
      `callbackUrl` and honour it after.
- [ ] Merge the guest cart into the customer cart on sign-in.
- [ ] Rate-limit the sign-in endpoint (Upstash Redis or equivalent).

**Done when:** a guest can add to cart, sign in, and find their cart intact.

---

## Phase 6 — Checkout

- [ ] `/checkout` as a single page with three sections — contact, delivery,
      payment — not a multi-page wizard. Fewer navigations, less abandonment.
- [ ] Address form with Indian fields: name, line 1, line 2, landmark, city,
      state (dropdown), 6-digit PIN, 10-digit phone.
- [ ] PIN code lookup to auto-fill city and state, and to check serviceability.
- [ ] Validation with **Zod**, shared between client and server action. One
      schema, two consumers.
- [ ] "Billing address same as delivery" toggle.
- [ ] Gift options — recipient name, gift message for the card, hide prices in
      the parcel, preferred delivery date. **This is a gifting house; treat gift
      handling as a first-class feature, not a checkbox.**
- [ ] Shipping rate calculation (flat, by weight, or free above a threshold).
- [ ] GST calculation, and the CGST/SGST vs IGST split by destination state.
- [ ] Reserve stock when checkout begins; release it if payment does not
      complete within 15 minutes.
- [ ] Create the `Order` in `pending` state *before* redirecting to payment.

---

## Phase 7 — Payments

- [ ] Razorpay account, KYC, and both test and live key pairs.
- [ ] Keys in environment variables. `RAZORPAY_KEY_SECRET` is server-only and
      must never appear in a `NEXT_PUBLIC_` name.
- [ ] Server action creating a Razorpay Order from our `Order`.
- [ ] Razorpay Checkout on the client, prefilled with the customer's details.
- [ ] Verify the payment signature **server-side** with HMAC-SHA256. A
      client-reported success is not a payment.
- [ ] **Webhook** at `/api/webhooks/razorpay`:
  - [ ] Verify the webhook signature before parsing anything.
  - [ ] Handle `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`.
  - [ ] Make it idempotent — store the event id, ignore repeats. Razorpay
        *will* deliver the same event more than once.
  - [ ] Treat the webhook, not the browser redirect, as the source of truth. A
        customer who closes the tab after paying must still get their order.
- [ ] Order state machine: `pending → paid → processing → shipped → delivered`,
      with `payment_failed`, `cancelled`, `refunded` as terminal branches.
      Transitions in one module; no scattered status writes.
- [ ] Decrement stock on `paid`, not before.
- [ ] `/checkout/success/[orderNumber]` and a failure page that retries rather
      than dead-ends.
- [ ] Test the full matrix in Razorpay test mode: success, failure, UPI timeout,
      and the tab closed mid-payment.

**Done when:** a test payment produces a `paid` order, decremented stock and a
confirmation email, and closing the tab mid-payment still produces all three.

---

## Phase 8 — Orders, fulfilment and email

- [ ] Transactional email via **Resend** with **React Email** templates:
      order confirmation, payment failed, shipped with tracking, delivered,
      refund processed.
- [ ] Templates in the brand's register — Cormorant display, generous space,
      one gold rule. A default Bootstrap receipt undoes a lot of Phase 0.
- [ ] Order confirmation shows gift message and delivery date when present.
- [ ] Packing slip view for the studio, printable, **without prices** when the
      order is flagged as a gift.
- [ ] Shipping integration per D7, or a manual AWB field plus a "mark shipped"
      action.
- [ ] Order tracking page reachable by order number + email, no login needed.
- [ ] Cancellation window and a refund action that calls the Razorpay refund
      API and moves the order state.

---

## Phase 9 — Admin

- [ ] `/admin` behind a role check on `Customer.role`.
- [ ] Orders: list, filter by status, open one, transition its state, refund.
- [ ] Products: create, edit, upload images, reorder, publish/unpublish.
- [ ] Inventory: adjust stock with a reason, low-stock view.
- [ ] Discount codes: create, limit, expire.
- [ ] Enquiries inbox for bespoke commissions and corporate suites (D4).
- [ ] `revalidateTag` on every write so the static catalog refreshes.

If this phase looks large, it is. A defensible shortcut for launch: skip the
product editor, keep the catalog in the seed script, and build only the orders
view. You cannot skip the orders view.

---

## Phase 10 — Compliance, trust and the boring necessities

India-specific and non-optional for taking money:

- [ ] Terms of Service, Privacy Policy, Refund & Cancellation Policy, Shipping
      Policy. Razorpay checks for these during activation.
- [ ] GSTIN displayed; GST-compliant invoice PDF per order.
- [ ] **FSSAI licence number** displayed on the site and on every edible
      product page — honey, chocolate, tisanes, nuts. Legally required.
- [ ] Per `fnf.md` §4: batch/lot and best-before on edible PDPs; a preserved
      botanical care note (dry storage, away from moisture); a candle safety
      note (never leave burning unattended, trim the wick).
- [ ] Contact page with a real address and phone.
- [ ] Cookie consent if analytics are added.
- [ ] `robots.txt`, `sitemap.xml` generated from the catalog.
- [ ] Analytics: Vercel Analytics or Plausible, plus commerce events —
      view item, add to cart, begin checkout, purchase.

---

## Phase 11 — Launch checklist

- [ ] Every price re-verified against `fnf.md` by a human. The figures in the
      catalog are *suggested* retail.
- [ ] Razorpay switched to live keys; one real ₹1 order placed and refunded.
- [ ] Webhook endpoint reachable from the public internet and verified in the
      Razorpay dashboard.
- [ ] Order confirmation email lands in Gmail's inbox, not Promotions or Spam.
      Configure SPF, DKIM and DMARC on the sending domain.
- [ ] Full purchase on a real mid-range Android over 4G, not just a desktop.
- [ ] Lighthouse ≥ 90 performance on the PDP and the cart.
- [ ] Keyboard-only pass through the entire purchase flow.
- [ ] Screen-reader pass on the cart and checkout.
- [ ] Stock counts match physical inventory.
- [ ] Database backups on and tested by restoring one.
- [ ] Error tracking (Sentry) reporting from production.
- [ ] The marketing page still runs at 60fps after all of the above.

---

## Suggested order of work

Phases 0 → 1 → 3 (start photography in parallel, it has the longest lead time)
→ 2 → 4 → 6 → 7 → 5 → 8 → 9 → 10 → 11.

Auth (5) deliberately lands *after* payments. Guest checkout means the store can
take money before it can create an account, and shipping revenue earlier is
worth more than shipping a profile page.
