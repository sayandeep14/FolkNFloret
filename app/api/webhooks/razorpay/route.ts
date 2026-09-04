import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { razorpayConfig, verifyWebhookSignature } from "@/lib/razorpay";
import { markPaid, markPaymentFailed, markRefunded } from "@/lib/order-state";

/**
 * Razorpay's view of the truth.
 *
 * This, not the browser's success callback, is what decides an order is paid.
 * A customer who pays and immediately closes the tab never runs the callback,
 * and their order still has to arrive. The callback is a latency optimisation;
 * this is the record.
 *
 * Three rules, in order:
 *
 *  1. Verify the signature over the **raw body**, before parsing. Parsing and
 *     re-serialising changes the bytes and the HMAC will never match again.
 *  2. Be idempotent. Razorpay retries, and will deliver the same event more
 *     than once — that is documented behaviour, not a fault. The event id is
 *     stored under a unique constraint and a repeat is a no-op.
 *  3. Answer 200 to anything already handled or not understood. A non-2xx puts
 *     Razorpay into a retry loop over something that will never succeed.
 */
export async function POST(request: Request) {
  const config = razorpayConfig();
  const secret = config?.webhookSecret;
  if (!secret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(secret, raw, signature)) {
    // Unsigned or wrongly signed: someone other than Razorpay. 400, and
    // nothing about why.
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  let event: {
    event: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      refund?: { entity?: Record<string, unknown> };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }

  // Razorpay's own id for this delivery. Falling back to a hash of the body
  // keeps idempotency working if the header is ever absent.
  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    `body:${Buffer.from(raw).toString("base64").slice(0, 64)}`;

  try {
    await db.webhookEvent.create({
      data: {
        provider: "razorpay",
        eventId,
        eventType: event.event,
        payload: JSON.parse(raw),
      },
    });
  } catch {
    // Unique violation: already processed. Not an error, and not worth doing
    // again — 200 so Razorpay stops retrying.
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const payment = event.payload?.payment?.entity as
    | { id?: string; order_id?: string; amount?: number; method?: string; error_description?: string; notes?: { orderNumber?: string } }
    | undefined;
  const refund = event.payload?.refund?.entity as
    | { payment_id?: string; amount?: number }
    | undefined;

  /** Finds our order from the notes we set, or from the payment row we wrote. */
  async function resolveOrderId(): Promise<string | null> {
    const fromNotes = payment?.notes?.orderNumber;
    if (fromNotes) {
      const order = await db.order.findUnique({
        where: { orderNumber: fromNotes },
        select: { id: true },
      });
      if (order) return order.id;
    }
    const providerOrderId = payment?.order_id;
    if (providerOrderId) {
      const row = await db.payment.findFirst({
        where: { providerOrderId },
        select: { orderId: true },
      });
      if (row) return row.orderId;
    }
    if (refund?.payment_id) {
      const row = await db.payment.findUnique({
        where: { providerPaymentId: refund.payment_id },
        select: { orderId: true },
      });
      if (row) return row.orderId;
    }
    return null;
  }

  const orderId = await resolveOrderId();
  if (!orderId) {
    console.error(`[webhook] ${event.event}: no matching order`);
    // 200 anyway: retrying will not conjure an order we have no record of.
    return NextResponse.json({ ok: true, matched: false });
  }

  switch (event.event) {
    case "payment.captured":
    case "order.paid": {
      if (!payment?.id) break;
      await markPaid(orderId, {
        providerPaymentId: payment.id,
        providerOrderId: payment.order_id,
        amountInPaise: payment.amount ?? 0,
        method: payment.method,
        raw: event,
      });
      break;
    }

    case "payment.failed": {
      await markPaymentFailed(orderId, {
        providerPaymentId: payment?.id,
        reason: payment?.error_description,
        raw: event,
      });
      break;
    }

    case "refund.processed": {
      await markRefunded(orderId, {
        providerPaymentId: refund?.payment_id,
        amountInPaise: refund?.amount,
      });
      break;
    }

    default:
      // Razorpay sends far more than we subscribe to. Recorded, ignored.
      break;
  }

  return NextResponse.json({ ok: true });
}
