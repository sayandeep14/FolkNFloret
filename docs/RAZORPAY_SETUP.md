# Razorpay setup

Test mode first. Everything below works with test keys and no KYC; activation
is only needed to take real money.

---

## 1. Account and test keys

1. Sign up at **dashboard.razorpay.com**.
2. Make sure the mode toggle (top of the dashboard) reads **Test Mode**.
3. **Account & Settings → API Keys → Generate Test Key**.
4. You get `rzp_test_...` and a secret. **The secret is shown once.**

```
RAZORPAY_KEY_ID="rzp_test_TXwTlasf0acR4g"
RAZORPAY_KEY_SECRET="6qDMzgO0tMRyaUeXlNQzFtua"
```

The key *id* is handed to the browser deliberately — Razorpay Checkout needs
it, and it identifies rather than authorises. The **secret must never gain a
`NEXT_PUBLIC_` prefix**: that ships it to every visitor, and with it anyone can
forge the signature that says an order was paid.

This app passes the key id from the server when payment starts, so there is no
public env var to get wrong.

---

## 2. The webhook

This is what actually marks orders paid. The browser's success callback is a
latency optimisation; a customer who pays and closes the tab never runs it.

1. **Account & Settings → Webhooks → Add New Webhook**.
2. **Webhook URL** — `https://www.folknfloret.com/api/webhooks/razorpay`
   Note the `www`. Run `npm run check:oauth -- https://folknfloret.com` if you
   ever need reminding which host is canonical.
3. **Secret** — a value *you* invent. Razorpay does not generate it. Use
   something long and random:
   ```bash
   openssl rand -hex 32
   ```
   Put the same value in both places:
   ```
   RAZORPAY_WEBHOOK_SECRET="0587d5bd9aa186ae7152f190b1803d8613b3bc892ca6a224f51b553a51ca3d48"
   ```
4. **Active events** — subscribe to exactly these four:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
   - `refund.processed`

   Anything else is recorded and ignored, so subscribing to more is harmless
   but pointless.

Razorpay cannot reach `localhost`. To exercise the webhook against a local
server, either use a tunnel (`ngrok http 3000`) and register that URL
temporarily, or run the local harness described at the bottom.

---

## 3. Into the environment

`.env.local` for development, and Vercel → **Settings → Environment
Variables** for Production and Preview:

| Variable | Notes |
|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_...` until launch |
| `RAZORPAY_KEY_SECRET` | server-only |
| `RAZORPAY_WEBHOOK_SECRET` | the value you invented, server-only |

Redeploy after adding them — Vercel does not apply new variables to an existing
deployment.

---

## 4. Test the whole matrix

With test keys, place an order and pay.

**Use UPI, not a card.** Indian Razorpay accounts are domestic-only until
international payments are separately enabled, and the card most test guides
reach for — `4111 1111 1111 1111` — is treated as international. It fails with
*"this business accepts domestic (Indian) card payments only"*, which reads
like a bug in the shop and is not one. That exact failure is already recorded
against two orders here.

| To test | Use |
|---|---|
| **Success** | UPI id `success@razorpay` |
| **Failure** | UPI id `failure@razorpay` |
| Netbanking | any bank, then choose Success on Razorpay's simulated page |
| Cards | only once international payments are enabled on the account |

Four cases worth walking, not one:

1. **Success.** Order becomes `PAID`, `stockOnHand` drops, `stockReserved`
   returns to zero, the cart is marked `CONVERTED`.
2. **Failure.** Order becomes `PAYMENT_FAILED`, **stock is untouched** and the
   hold stands, so the customer can retry on the same order page.
3. **Dismiss the modal.** Same as failure — nothing charged, hold intact.
4. **Close the tab immediately after paying.** The success callback never runs.
   The order must still become `PAID`, from the webhook alone. This is the case
   that separates a store that works from one that loses orders, and it is the
   only reason the webhook exists.

Check the dashboard's **Webhooks → recent deliveries** if an order stays
pending: a non-2xx there means the endpoint rejected the signature, which
almost always means `RAZORPAY_WEBHOOK_SECRET` differs between the dashboard and
the deployment.

---

## 5. Going live

Not yet — this is a Phase 11 item, listed here so it is in one place.

1. Complete KYC in the dashboard (PAN, GST, bank account, business proof).
2. Razorpay checks for **Terms, Privacy, Refund & Cancellation, and Shipping
   policy pages** during activation. Those are Phase 10; do them before
   applying rather than during.
3. Generate **live** keys and replace all three variables in Vercel.
4. Add a second webhook for the live mode — test and live webhooks are
   configured separately and do not carry over.
5. Place one real ₹1 order and refund it.

---

## Verifying the endpoint without Razorpay

The webhook can be exercised locally without touching Razorpay at all, by
signing a payload with the same secret. That is how the handler was checked:

- a forged signature is rejected with 400
- an unsigned request is rejected with 400
- a valid capture marks the order paid and moves stock exactly once
- **a redelivery under a new event id still does not double-count** — the
  event-id table dedupes retries, and the guarded status transition catches
  anything that slips past it
- a refund returns stock exactly once

Razorpay *will* deliver the same event more than once. That is documented
behaviour, not a fault, and both defences exist because either alone has a gap.
