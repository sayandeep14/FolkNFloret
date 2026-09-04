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

- [x] **Postgres provisioned** on Supabase (`ap-southeast-1`), migration
      applied, catalogue seeded, and row-level security enabled on all 18
      tables. Walkthrough: **[docs/SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**.
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
      6 bundles with 27 components. Idempotent — upserts by slug and SKU, and deliberately does
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
cp .env.example .env.local          # then fill in DATABASE_URL and DIRECT_URL
npm run db:generate                 # build the client from the schema
npm run db:deploy                   # apply prisma/migrations
npm run db:seed                     # load the catalogue
npm run db:studio                   # eyeball it
```

On a managed host the app and the migrations need *different* connections:
`DATABASE_URL` is pooled, `DIRECT_URL` is not. DDL cannot go through a
transaction pooler, because Prisma's migration lock is a Postgres advisory lock
and a pooler hands out a different backend per statement.

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

## Phase 2 — Product catalog ✅ *complete*

- [x] `app/(shop)/shop/page.tsx` — every active product, filterable by
      collection and sortable.
- [x] `app/(shop)/collections/[slug]/page.tsx` — Aromatics, Epicurean,
      Preserved, The Suites.
- [x] `app/(shop)/products/[slug]/page.tsx` — the PDP.
- [x] `ProductCard`: plate, latin name, title, subtitle, from-price, and a
      stock flag when there is something to say.
- [x] PDP in the order the roadmap asked for: gallery, title + latin, price,
      variant selector, quantity, bag, then the long-form sections. The
      packaging has a heading of its own — *How it is given* — beside the
      description rather than collapsed underneath it.
- [x] Out-of-stock and low-stock on both card and PDP, verified by zeroing two
      SKUs against the live database and restoring them.
- [x] Bundle PDPs list their components with links and quantities.
- [x] Sorting: featured, price ascending, price descending, newest. Filters and
      sorts are **links, not a form** — every state has its own URL, and both
      work with JavaScript disabled.
- [x] `generateStaticParams` + ISR. All 19 PDPs prerender; see the note below
      on why the listing pages do not.
- [x] `generateMetadata` per product and per collection, with canonicals, plus
      a generated Open Graph card per product set in the house serif.
- [x] JSON-LD `Product` with `Offer`, or `AggregateOffer` when the price varies
      by variant — a range presented as a single price is a rich-result
      violation.
- [x] `lib/revalidate.ts` exposes `revalidateCatalog()` for Phase 9's admin
      writes.

### Two decisions worth knowing

**The listing pages render on demand; the PDPs are static.** Reading
`searchParams` makes a route dynamic whatever `generateStaticParams` says, and
the filter and sort live in the query string. They stay fast anyway: every read
goes through `unstable_cache` tagged `catalog`, so a request touches Postgres
only after a revalidation. The 19 PDPs are fully prerendered with `revalidate =
3600`.

**A bundle is only as available as its scarcest component.** `bundleAvailability`
takes the minimum of the suite's own assembled count and, for each component,
`floor(componentAvailable / quantity)`. Verified: starving the seed-paper
journal takes the Botanical Harvest Suite out of stock even though eight of the
suite itself remain — which is D3 working rather than a display detail.

### SEO

Checked by hand on a PDP rather than by running Lighthouse, which needs a
public URL: unique title and description, canonical, `og:title`/`og:image`
(200, image/png, 65KB), `lang`, viewport, exactly one `h1`, zero images without
alt, and valid `Product` JSON-LD with `priceCurrency: INR`. `robots.txt` and
`sitemap.xml` are Phase 10 and are the remaining gap before an honest
Lighthouse SEO number.

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
      dimensions to hold layout. Every image already carries `sizes` and
      explicit dimensions; the only change when photography lands is dropping
      `unoptimized`, which is there solely because the placeholders are SVG.
- [x] Cormorant Garamond vendored at `assets/fonts/` (OFL) so the Open Graph
      cards set in the house serif without the build depending on the network.
- [ ] Alt text for every image, written as description not keyword soup.

---

## Phase 4 — Cart ✅ *complete*

- [x] Cart identity: an HttpOnly cookie holding a 256-bit random token. See the
      note below on why it is not signed.
- [x] Server actions: `addItem`, `updateQuantity`, `removeItem`,
      `applyDiscount`, each returning the recomputed cart.
- [x] **Re-priced on the server on every read.** The client sends a variant id
      and a quantity and never a price. Verified by raising a variant's price
      in the database: the line moved from ₹1,650 to ₹2,000 on the next load
      even though the cart row still cached the old figure.
- [x] Stock validated on add, and again on every read — a line whose stock has
      moved under it is trimmed or dropped with a notice, rather than
      discovered at checkout. Verified.
- [x] Cart drawer plus a full `/cart` page. The page is server-rendered, so the
      bag is real content on first paint and reads correctly with JavaScript
      disabled — checked with `javaScriptEnabled: false`.
- [x] Optimistic quantity changes with `useOptimistic`, reconciled against the
      server's answer.
- [x] `OrderSummary` is one component, used verbatim by the drawer and the cart
      page, computing from `lib/pricing.ts`. Checkout and the confirmation will
      use the same one.
- [x] Empty state routing back into the collections.

**Verified end to end:** add with a variant and quantity → drawer opens → badge
counts → survives a reload → survives a fresh browser context carrying the same
cookies → the no-JS page renders the same total.

### Three decisions

**Prices are GST-inclusive.** That is the Indian retail norm: ₹1,450 is what
the customer pays, and the tax is a component of it rather than an addition to
it. So `lib/pricing.ts` *shows* GST and never *adds* it. Getting this backwards
inflates every price by 12–18% at the last step. Mixed rates in one bag are
handled per line — honey at 5% beside chocolate at 18% is the normal case here.

**The cookie is not signed**, which the roadmap originally called for. The token
is 256 bits of randomness and is looked up in the database, so a forged one
resolves to no cart rather than to someone else's. A signature would only let
us reject garbage a millisecond earlier, which is a rate-limiting problem
rather than a cryptographic one, and it would add a secret whose rotation
silently empties every cart.

**A second, readable cookie carries only the item count.** The marketing page
is static; fetching a cart on every visit would put a round trip in front of a
page that needs none. Now the badge paints from the cookie and the real cart
loads only when the bag is opened — measured at **zero requests** on the
marketing page with a bag held, and one when it is opened. The count is
advisory: nothing is priced from it, and it corrects itself as soon as the
real cart arrives.

**Done when:** ✅ items survive a page reload and a browser restart, and editing
a product's price in the database changes the cart total on next load.

---

## Phase 5 — Customer accounts ✅ *complete, pending provider keys*

- [x] **Auth.js v5** with the Prisma adapter. Pinned at `5.0.0-beta.32`, which
      is what the App Router ecosystem runs on; the beta tag has been stable a
      long time but it is a beta and worth knowing.
- [x] Email magic link (Resend) and Google. **Providers are assembled from
      whichever credentials are present** — a deployment with no keys still
      sells, and the sign-in page says sign-in is unavailable rather than
      throwing on every route that reads a session.
- [x] `/account` order history · `/account/orders/[orderNumber]` ·
      `/account/addresses` · `/account/profile`.
- [x] Middleware protecting `/account/*`, redirecting with a `callbackUrl`.
- [x] Guest cart merges into the account cart on sign-in.
- [x] Rate limiting on the magic-link endpoint, on the address *and* the IP.

### What you still need to supply

Sign-in cannot work until these are set. Everything else does.

| Variable | Where from |
|---|---|
| `AUTH_SECRET` | already generated into `.env.local` |
| `AUTH_RESEND_KEY`, `EMAIL_FROM` | resend.com, after verifying the sending domain |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google Cloud console |
| `AUTH_URL` | production only, pins the OAuth callback to the canonical domain |

Step by step: **[docs/AUTH_SETUP.md](./AUTH_SETUP.md)**.

### Three decisions

**`Customer` was renamed to `User`.** `@auth/prisma-adapter` addresses
`prisma.user` by name. Done while the table had zero rows; after the first
sign-up it would have meant migrating live data rather than a clean drop.

**Rate limiting lives in Postgres, not memory.** Every serverless invocation is
a fresh process, so an in-process counter resets constantly and limits nothing
— and a magic-link endpoint is exactly what gets turned into a mail cannon.
Upstash is the answer at volume; a table needs no third service to launch.

**Middleware checks only for a session cookie.** Prisma cannot run on the edge.
The account layout does the real `auth()` check, which also catches a cookie
whose session has been revoked.

---

## Phase 6 — Checkout ✅ *complete*

- [x] `/checkout` as one page with three sections — contact, delivery, gift.
      Not a wizard: every navigation between steps is a place to abandon.
- [x] Indian address fields, with state as a dropdown of all 36 states and
      union territories.
- [x] **PIN code lookup** fills city and state from India Post, proxied through
      `/api/pincode/[code]` and cached for a day. Advisory: a failed lookup
      blocks nothing, and the fields stay editable — the Post Office's district
      and the customer's idea of their city do not always agree, and theirs is
      the one on the parcel.
- [x] One Zod schema in `lib/address.ts`, used by the account address book and
      by checkout, on client and server. Phone numbers normalise on the way in.
- [x] "Billing address is the same" toggle, with an explicit hidden field for
      the off state — an unchecked checkbox sends nothing, and the server would
      have read absent as "same".
- [x] Gift options: recipient, a message for the card, hide prices in the
      parcel, preferred delivery date. First-class, not a checkbox.
- [x] Shipping: flat ₹150, free above ₹2,500, with the shortfall shown.
- [x] GST is computed per line at each item's own rate. Verified with a mixed
      bag: honey at 5% beside chocolate at 18% gives ₹195.28 on ₹2,140.
- [x] Stock reserved when the order is placed, released after 15 minutes.
- [x] `Order` created in `PENDING` **before** payment.

**Verified end to end:** a guest filled the form, the PIN lookup resolved
643217 to Nilgiris, Tamil Nadu, the order was created with correct snapshots
(title, SKU, HSN, unit price, tax rate), the gift fields and address snapshot
persisted, and stock moved to reserved. Expiring that reservation and starting
another checkout cancelled the stale order and gave its stock back, leaving
only the new hold.

### Two decisions

**The order exists before the money does.** A customer who pays and then closes
the tab must still end up with an order, and that is only possible if the order
is already there for Phase 7's webhook to find.

**Reserving is one conditional update per line inside a transaction** —
`updateMany` with a stock guard returns a count, so two simultaneous checkouts
for the last suite cannot both succeed. Checking availability first and writing
after would be a race.

**The cart is not emptied on order placement.** Payment has not happened; a
failed payment has to leave the customer with their bag, not an empty shop and
no order. Phase 7 clears it on `paid`.

**`redirect()` from the action was replaced with an explicit hand-off.** It
threw its control-flow signal through `useActionState` and the browser stayed
put — with the order already created, which is the worst of both. The action
returns the order number and the form navigates. One line of client code, and
observable when it breaks.

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
