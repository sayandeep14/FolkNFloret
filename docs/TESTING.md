# Testing it by hand

A walk through everything the site does, with what you should see. Roughly half
an hour end to end.

Do it in **Razorpay test mode**, where no money moves. Prices, stock and orders
are real database rows either way, so clean up afterwards (last section).

---

## Before you start

```bash
npm run db:check        # the app can reach the database
npm run build && npm run start
```

Then open `http://localhost:3000`. To test against production instead, use
`https://www.folknfloret.com` throughout — everything below works on both.

Have two browsers, or one plus a private window. You will want to be signed in
as staff in one and a customer in the other.

---

## 1 · The marketing page

Open `/`.

- [ ] The form appears and the copy fades in as you scroll — five chapters,
      one at a time.
- [ ] Scrolling all the way down passes through the collections, the craft,
      the suites, the quote and the commission block.
- [ ] The header is a floating glass capsule, and stays readable over both
      dark and bright parts of the page.
- [ ] Narrow the window below ~720px: the nav collapses into a hamburger and
      the header goes edge to edge.
- [ ] **In Safari and on a phone**, the page loads and keeps scrolling without
      going blank. This is worth re-checking after any change to the canvas —
      it has broken before.

---

## 2 · The catalogue

- [ ] `/shop` lists 19 products.
- [ ] The filters — Aromatics, Epicurean, Preserved, The Suites — each narrow
      the grid, and the URL changes so the state can be shared.
- [ ] The sorts change the order, and keep whichever filter is active.
- [ ] Open a product with variants, e.g. **Signature Hand-Poured Candle**.
      Choosing a fragrance updates the SKU under the button.
- [ ] Open a suite, e.g. **The Botanical Harvest Suite**. "What is inside"
      lists its contents, and each links to its own page.
- [ ] Long-form sections are present: what it is, how it is given, materials,
      care, food information where relevant, delivery.

---

## 3 · The bag

- [ ] Add something. The drawer opens with the line, and the header shows a
      count. **This should feel immediate** — if it takes several seconds,
      something is wrong; see OPERATIONS.
- [ ] Add a second, different product. Two lines, count of two.
- [ ] Change a quantity with − and +. The total follows.
- [ ] Remove a line.
- [ ] Reload the page. The bag survives.
- [ ] **Close the browser entirely and reopen.** Still there.
- [ ] `/cart` shows the same bag, the same total, and a GST line.
- [ ] Under ₹2,500 delivery is ₹150 and the page says how much more earns free
      delivery; above it, delivery reads "Complimentary".

### The one worth doing properly

- [ ] With something in your bag, open `npm run db:studio`, change that
      product's `priceInPaise`, and reload `/cart`. **The total must change.**
      Prices are re-read from the catalogue on every load; a bag can never
      hold a price you no longer offer.

---

## 4 · Stock

- [ ] In Prisma Studio, set a variant's `stockOnHand` to `2`. The product page
      says "Only 2 left".
- [ ] Set it to `0`. The card shows "Sold out", the button is disabled, and
      the quantity stepper will not go up.
- [ ] Set the **seed-paper journal** to `0` and open **The Botanical Harvest
      Suite**. It should also read sold out — the suite contains the journal,
      and a bundle is only as available as its scarcest component.
- [ ] Put the numbers back.

---

## 5 · Checkout

- [ ] With a bag, go to `/checkout`. Three sections: contact, delivery, gift.
- [ ] Type a PIN code — `643217` — and wait a moment. City and state fill in
      by themselves. This is advisory: if it fails, the fields stay editable
      and nothing blocks.
- [ ] Submit with the phone blank. The browser stops you.
- [ ] Enter a phone as `+91 98765 43210`. It is accepted and stored as ten
      digits.
- [ ] Tick **This is a gift**, add a recipient and a message.
- [ ] Place the order. You land on an order page with a number like
      `FF-XXXX-XXXX` and a fifteen-minute hold.
- [ ] In Prisma Studio, that variant's `stockReserved` has gone up by one and
      `stockOnHand` has **not** changed. Stock is held, not sold.

---

## 6 · Payment

Razorpay test instruments:

| To test | Use |
|---|---|
| Success | card `4111 1111 1111 1111`, any future expiry, any CVV |
| Failure | card `4000 0000 0000 0002` |
| UPI success | `success@razorpay` |
| UPI failure | `failure@razorpay` |

Four cases, not one:

- [ ] **Success.** Order becomes paid, `stockOnHand` drops, `stockReserved`
      returns to zero, and a confirmation email arrives.
- [ ] **Failure.** The order says the payment did not go through, **nothing is
      charged, the hold stands**, and you can try again on the same page.
- [ ] **Dismiss the payment window.** Same as failure.
- [ ] **Pay, then close the tab immediately** — before the page returns. Wait a
      minute, then open `/track` and look up the order. **It must be
      confirmed.** This is the case that separates a shop that works from one
      that quietly loses orders, and it is the only reason the webhook exists.

If an order stays pending after a successful payment, check Razorpay →
Webhooks → recent deliveries. A non-2xx there almost always means
`RAZORPAY_WEBHOOK_SECRET` differs between Razorpay and Vercel.

---

## 7 · Emails

Each should arrive within a minute, set in the house serif on an alabaster
ground — not a default receipt.

- [ ] Order confirmation, on payment. Shows the gift message and recipient
      when there is one.
- [ ] Shipped, with courier and tracking, when the studio marks it.
- [ ] Delivered.
- [ ] If they do not arrive, look in Resend → Emails. Present but not
      delivered is a DNS problem; absent means the app never sent.

---

## 8 · Tracking, without an account

- [ ] `/track`, with the order number and the email it was placed with. The
      order appears with a stage line — Confirmed, Processing, Shipped,
      Delivered.
- [ ] Try the same order number with **a different email**. It must say it
      cannot find the order — the same answer as for one that does not exist.
- [ ] For a **gift** order, no price appears anywhere on this page. Whoever is
      holding the number may be the recipient.

---

## 9 · Accounts

- [ ] `/signin`. Ask for a link, then follow it from your inbox.
- [ ] Or sign in with Google.
- [ ] `/account` lists your orders; opening one shows its contents and address.
- [ ] `/account/addresses` — add one, edit it, add a second, change which is
      default, delete one. There is always exactly one default.
- [ ] `/account/profile` — change your name and phone, save.
- [ ] Sign out. `/account` sends you back to sign-in.
- [ ] **The merge:** signed out, put something in your bag, then sign in. The
      bag is still there.

---

## 10 · The studio

Needs a `STAFF` or `ADMIN` role — see OPERATIONS.

- [ ] `/studio` as a customer, or signed out: refused.
- [ ] As staff: the queue of paid orders.
- [ ] Open one. Contents, gift instructions, address, contact.
- [ ] **Mark shipped** with a courier and AWB. The order moves to shipped and
      the customer gets a tracking email.
- [ ] **Mark delivered.** Another email.
- [ ] **Refund.** Money returns in Razorpay, the order reads refunded, and
      `stockOnHand` goes back up.
- [ ] Open the **packing slip** and print it. For a gift order, **no prices**
      anywhere on it, and the card message is there to copy by hand.

---

## 11 · The awkward ones

Worth doing once before launch.

- [ ] **Two tabs, one bag.** Add in one, reload the other. Consistent.
- [ ] **Let a hold expire.** Place an order, do not pay, wait sixteen minutes,
      then start another checkout. The stale order is cancelled and its stock
      is back.
- [ ] **Buy the last one.** Set stock to 1, put it in two different browsers'
      bags, check out in both. The second must fail cleanly, not oversell.
- [ ] **Keyboard only.** Tab from the top of a product page to the bag and
      through checkout without touching the mouse.
- [ ] **A real phone on mobile data**, not the desktop simulator.

---

## Cleaning up afterwards

Test orders are real rows. To clear them:

```bash
npm run db:studio
```

Delete from `Order` (its items go too), then `Cart`, then set any
`stockReserved` back to `0` and correct `stockOnHand`.

Or, to reset the catalogue's stock to its seeded opening balance, delete the
variants' rows… **no** — simply correct the numbers by hand. `db:seed`
deliberately will not overwrite stock, precisely so it cannot undo a real
count.

---

## What is not built yet

So you do not go looking:

- Adding or editing products in the studio — the catalogue is a file today.
- Stock adjustment with a reason and a history.
- Discount codes have no admin, and `usedCount` never increments.
- Customer-facing order cancellation. Refunds are a studio action.
- The bespoke commission form. `Enquiry` exists; nothing writes to it.
- Invoices, GST-compliant or otherwise.

All of it is planned in `STUDIO_ROADMAP.md` and `MARKETPLACE_ROADMAP.md`.
