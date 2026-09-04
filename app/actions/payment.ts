"use server";

import { db } from "@/lib/db";
import {
  createRazorpayOrder,
  razorpayConfig,
  verifyCheckoutSignature,
} from "@/lib/razorpay";
import { markPaid, markPaymentFailed } from "@/lib/order-state";

export type StartPaymentResult =
  | {
      ok: true;
      keyId: string;
      razorpayOrderId: string;
      amountInPaise: number;
      orderNumber: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: string };

type AddressSnapshot = { name?: string };

/**
 * Creates the Razorpay order for one of ours and hands the browser what it
 * needs to open Checkout. The amount comes from our Order row, never from the
 * client — the client's only input is which order it is talking about.
 */
export async function startPayment(
  orderNumber: string,
): Promise<StartPaymentResult> {
  const config = razorpayConfig();
  if (!config) return { ok: false, error: "Payments are not configured yet." };

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { payments: true },
  });
  if (!order) return { ok: false, error: "We could not find that order." };

  if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
    return { ok: false, error: `That order is already ${order.status.toLowerCase()}.` };
  }

  if (order.reservationExpiresAt && order.reservationExpiresAt < new Date()) {
    return {
      ok: false,
      error: "This order's hold has expired. Please start again from your bag.",
    };
  }

  // Reuse the Razorpay order across retries: a customer whose UPI timed out
  // and who tries again should not generate a second order for the same goods.
  const existing = order.payments.find(
    (payment) => payment.providerOrderId && payment.status === "CREATED",
  );

  let razorpayOrderId = existing?.providerOrderId ?? null;

  if (!razorpayOrderId) {
    try {
      const created = await createRazorpayOrder(config, {
        amountInPaise: order.totalInPaise,
        receipt: order.orderNumber,
        notes: { orderNumber: order.orderNumber, email: order.email },
      });
      razorpayOrderId = created.id;

      await db.payment.create({
        data: {
          orderId: order.id,
          provider: "razorpay",
          providerOrderId: created.id,
          status: "CREATED",
          amountInPaise: order.totalInPaise,
        },
      });
    } catch (error) {
      console.error("[payment] could not create a Razorpay order:", error);
      return { ok: false, error: "We could not reach the payment provider. Try again." };
    }
  }

  const shipping = order.shippingAddress as AddressSnapshot;

  return {
    ok: true,
    // The key id is public by design; the secret never leaves the server.
    keyId: config.keyId,
    razorpayOrderId,
    amountInPaise: order.totalInPaise,
    orderNumber: order.orderNumber,
    prefill: {
      name: shipping?.name ?? "",
      email: order.email,
      contact: order.phone ?? "",
    },
  };
}

export type ConfirmResult = { ok: boolean; error?: string };

/**
 * The browser reporting success. Verified, then applied — but never trusted as
 * the only path: the webhook applies the same change independently, because a
 * customer who pays and closes the tab still has to end up with a paid order.
 * Both call markPaid, which is idempotent.
 */
export async function confirmPayment(input: {
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<ConfirmResult> {
  const config = razorpayConfig();
  if (!config) return { ok: false, error: "Payments are not configured." };

  const order = await db.order.findUnique({
    where: { orderNumber: input.orderNumber },
  });
  if (!order) return { ok: false, error: "We could not find that order." };

  if (!verifyCheckoutSignature(config, input)) {
    // A bad signature is a forged success, not a mistake. Say nothing useful.
    console.error("[payment] signature mismatch for", input.orderNumber);
    return { ok: false, error: "We could not verify that payment." };
  }

  await markPaid(order.id, {
    providerPaymentId: input.razorpayPaymentId,
    providerOrderId: input.razorpayOrderId,
    amountInPaise: order.totalInPaise,
    raw: { source: "checkout" },
  });

  return { ok: true };
}

/** The browser reporting a dismissal or failure. Advisory; the hold stands. */
export async function reportPaymentFailure(
  orderNumber: string,
  reason?: string,
): Promise<void> {
  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) return;
  await markPaymentFailed(order.id, { reason: reason?.slice(0, 200) });
}
