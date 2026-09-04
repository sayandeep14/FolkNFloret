"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/staff";
import { transition, markRefunded } from "@/lib/order-state";
import { notifyDelivered, notifyShipped } from "@/lib/order-notify";
import { razorpayConfig } from "@/lib/razorpay";

export type FulfilState = { error?: string; ok?: boolean };

const shipSchema = z.object({
  orderNumber: z.string().trim().min(1),
  provider: z.string().trim().min(1).default("manual"),
  courier: z.string().trim().max(60).optional(),
  awb: z.string().trim().max(60).optional(),
  trackingUrl: z.union([z.url(), z.literal("")]).optional(),
});

/**
 * Marks an order shipped and records the airway bill.
 *
 * Manual for now. D7 chose an aggregator, and `Shipment.provider` already names
 * one rather than assuming it, so wiring Shiprocket later means filling these
 * fields from their API response instead of from a form — no migration, and
 * this action stays the fallback for anything hand-carried.
 */
export async function markShipped(
  _previous: FulfilState,
  formData: FormData,
): Promise<FulfilState> {
  await requireStaff();

  const parsed = shipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the tracking details." };

  const order = await db.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
  });
  if (!order) return { error: "No such order." };

  // PAID orders can ship directly; the PROCESSING step is optional.
  const moved = await transition(order.id, "SHIPPED");
  if (!moved.ok || !moved.changed) {
    return { error: `An order that is ${order.status.toLowerCase()} cannot be shipped.` };
  }

  const shipment = await db.shipment.create({
    data: {
      orderId: order.id,
      provider: parsed.data.provider,
      courier: parsed.data.courier || null,
      awb: parsed.data.awb || null,
      trackingUrl: parsed.data.trackingUrl || null,
      status: "IN_TRANSIT",
      shippedAt: new Date(),
    },
  });

  await notifyShipped(order.id, {
    courier: shipment.courier,
    awb: shipment.awb,
    trackingUrl: shipment.trackingUrl,
  });

  revalidatePath(`/studio/orders/${order.orderNumber}`);
  return { ok: true };
}

export async function markDelivered(formData: FormData): Promise<void> {
  await requireStaff();
  const orderNumber = String(formData.get("orderNumber"));
  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) return;

  const moved = await transition(order.id, "DELIVERED");
  if (!moved.ok || !moved.changed) return;

  await db.shipment.updateMany({
    where: { orderId: order.id },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });
  await notifyDelivered(order.id);
  revalidatePath(`/studio/orders/${orderNumber}`);
}

/**
 * Refunds through Razorpay, then moves our state. In that order on purpose: if
 * the API call fails we must not tell the customer their money is coming.
 */
export async function refundOrder(
  _previous: FulfilState,
  formData: FormData,
): Promise<FulfilState> {
  await requireStaff();

  const orderNumber = String(formData.get("orderNumber"));
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { payments: { where: { status: "CAPTURED" } } },
  });
  if (!order) return { error: "No such order." };

  const captured = order.payments[0];
  if (!captured?.providerPaymentId) {
    return { error: "No captured payment to refund." };
  }

  const config = razorpayConfig();
  if (!config) return { error: "Payments are not configured." };

  try {
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${captured.providerPaymentId}/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
        },
        body: JSON.stringify({ amount: order.totalInPaise, speed: "normal" }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[refund] Razorpay refused:", response.status, detail.slice(0, 200));
      return { error: "Razorpay refused that refund. Check the dashboard." };
    }
  } catch (error) {
    console.error("[refund] could not reach Razorpay:", error);
    return { error: "Could not reach Razorpay. Nothing has been changed." };
  }

  // refund.processed will arrive as a webhook too; markRefunded is idempotent,
  // so whichever gets there first wins and the other does nothing.
  await markRefunded(order.id, {
    providerPaymentId: captured.providerPaymentId,
    amountInPaise: order.totalInPaise,
  });

  revalidatePath(`/studio/orders/${orderNumber}`);
  return { ok: true };
}
