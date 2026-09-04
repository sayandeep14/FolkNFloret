import "server-only";
import type { OrderStatus, Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import {
  notifyPaid,
  notifyPaymentFailed,
  notifyRefunded,
} from "@/lib/order-notify";

/**
 * Every order status change goes through this module. Scattering
 * `order.update({ status })` across actions and webhooks is how a shop ends up
 * with paid orders that never decremented stock, or refunded ones that shipped
 * anyway — the transitions stop being a machine and become a set of habits.
 */

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "PAYMENT_FAILED", "CANCELLED"],
  // A failed payment is retryable: Razorpay hands back a fresh attempt on the
  // same order, so this is not terminal.
  PAYMENT_FAILED: ["PENDING", "PAID", "CANCELLED"],
  // SHIPPED is reachable directly. A studio of this size packs and posts in
  // one movement; PROCESSING exists for the days when it does not, and making
  // it compulsory would only mean clicking through a state nobody occupied.
  PAID: ["PROCESSING", "SHIPPED", "REFUNDED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "REFUNDED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from].includes(to);
}

export type TransitionResult =
  | { ok: true; changed: boolean }
  | { ok: false; reason: string };

/**
 * Moves an order, once.
 *
 * The guard is in the WHERE clause rather than in a preceding read: an
 * `updateMany` scoped to the statuses that may legally precede `to` reports how
 * many rows it changed, so two callers racing — the browser's success handler
 * and Razorpay's webhook, which is the normal case, not an edge case — cannot
 * both believe they were first. The loser gets `changed: false` and does
 * nothing, which is what makes the side effects below safe to attach.
 */
export async function transition(
  orderId: string,
  to: OrderStatus,
  options: {
    tx?: Prisma.TransactionClient;
    data?: Prisma.OrderUpdateManyMutationInput;
  } = {},
): Promise<TransitionResult> {
  const client = options.tx ?? db;
  const from = (Object.keys(ALLOWED) as OrderStatus[]).filter((status) =>
    ALLOWED[status].includes(to),
  );
  if (!from.length) return { ok: false, reason: `Nothing may become ${to}.` };

  const result = await client.order.updateMany({
    where: { id: orderId, status: { in: from } },
    data: { status: to, ...options.data },
  });

  return { ok: true, changed: result.count > 0 };
}

/**
 * Marks an order paid and turns its reservation into a sale.
 *
 * Stock moves here and only here. `stockReserved` comes down because the hold
 * is over; `stockOnHand` comes down because the goods are now spoken for. Doing
 * it inside the same transaction as the status change means the two cannot
 * disagree, and the conditional transition means a webhook redelivery — which
 * Razorpay guarantees will happen — cannot decrement twice.
 */
export async function markPaid(
  orderId: string,
  payment: {
    providerPaymentId: string;
    providerOrderId?: string;
    amountInPaise: number;
    method?: string;
    raw?: unknown;
  },
): Promise<{ alreadyPaid: boolean }> {
  const result = await applyPayment(orderId, payment);

  // After the transaction, not inside it: a slow mail API must not hold a
  // database transaction open, and a receipt for an order that then rolled
  // back would be worse than a late one. Only on the transition that actually
  // changed something, so a webhook redelivery sends nothing.
  if (!result.alreadyPaid) await notifyPaid(orderId);

  return result;
}

async function applyPayment(
  orderId: string,
  payment: {
    providerPaymentId: string;
    providerOrderId?: string;
    amountInPaise: number;
    method?: string;
    raw?: unknown;
  },
): Promise<{ alreadyPaid: boolean }> {
  return db.$transaction(async (tx) => {
    const moved = await transition(orderId, "PAID", {
      tx,
      data: { placedAt: new Date(), reservationExpiresAt: null },
    });

    if (!moved.ok || !moved.changed) {
      // Someone else got there first. Still record the payment row if it is
      // new, so a second payment id on one order is visible rather than lost.
      await tx.payment.upsert({
        where: { providerPaymentId: payment.providerPaymentId },
        create: {
          orderId,
          provider: "razorpay",
          providerOrderId: payment.providerOrderId ?? null,
          providerPaymentId: payment.providerPaymentId,
          status: "CAPTURED",
          amountInPaise: payment.amountInPaise,
          method: payment.method ?? null,
          rawPayload: (payment.raw ?? undefined) as Prisma.InputJsonValue,
        },
        update: { status: "CAPTURED" },
      });
      return { alreadyPaid: true };
    }

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      if (!item.variantId) continue;
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          stockOnHand: { decrement: item.quantity },
          stockReserved: { decrement: item.quantity },
        },
      });
    }

    await tx.payment.upsert({
      where: { providerPaymentId: payment.providerPaymentId },
      create: {
        orderId,
        provider: "razorpay",
        providerOrderId: payment.providerOrderId ?? null,
        providerPaymentId: payment.providerPaymentId,
        status: "CAPTURED",
        amountInPaise: payment.amountInPaise,
        method: payment.method ?? null,
        rawPayload: (payment.raw ?? undefined) as Prisma.InputJsonValue,
      },
      update: { status: "CAPTURED" },
    });

    // The bag has become an order, so retire it — but only now, and only the
    // one that produced this order. Doing it at checkout would leave a
    // customer whose payment failed with no order and no bag.
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { cartId: true },
    });
    if (order?.cartId) {
      await tx.cart.updateMany({
        where: { id: order.cartId, status: "ACTIVE" },
        data: { status: "CONVERTED" },
      });
    }

    return { alreadyPaid: false };
  });
}

/** Records a failure without moving stock — the hold stands until it expires. */
export async function markPaymentFailed(
  orderId: string,
  detail: { providerPaymentId?: string; reason?: string; raw?: unknown },
): Promise<void> {
  const moved = await transition(orderId, "PAYMENT_FAILED");

  if (detail.providerPaymentId) {
    await db.payment.upsert({
      where: { providerPaymentId: detail.providerPaymentId },
      create: {
        orderId,
        provider: "razorpay",
        providerPaymentId: detail.providerPaymentId,
        status: "FAILED",
        amountInPaise: 0,
        failureReason: detail.reason ?? null,
        rawPayload: (detail.raw ?? undefined) as Prisma.InputJsonValue,
      },
      update: { status: "FAILED", failureReason: detail.reason ?? null },
    });
  }

  // Only on the first failure. A customer retrying three times should not
  // collect three identical letters.
  if (moved.ok && moved.changed) await notifyPaymentFailed(orderId);
}

/** Gives stock back and marks the money returned. */
export async function markRefunded(
  orderId: string,
  detail: { providerPaymentId?: string; amountInPaise?: number },
): Promise<void> {
  let refunded = false;

  await db.$transaction(async (tx) => {
    const moved = await transition(orderId, "REFUNDED", { tx });
    if (!moved.ok || !moved.changed) return;

    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      if (!item.variantId) continue;
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockOnHand: { increment: item.quantity } },
      });
    }

    if (detail.providerPaymentId) {
      await tx.payment.updateMany({
        where: { providerPaymentId: detail.providerPaymentId },
        data: { status: "REFUNDED" },
      });
    }
    refunded = true;
  });

  if (refunded) await notifyRefunded(orderId);
}
