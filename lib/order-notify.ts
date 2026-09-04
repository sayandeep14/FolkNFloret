import "server-only";
import { db } from "@/lib/db";
import { send } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import {
  OrderConfirmation,
  OrderDelivered,
  OrderRefunded,
  OrderShipped,
  PaymentFailed,
  type OrderEmailData,
} from "@/components/email/OrderEmails";

/**
 * Turns an order into the shape the templates want, and posts the letter.
 *
 * Callers invoke these only when a transition actually *changed* something —
 * `markPaid` returns `alreadyPaid`, and a webhook redelivery must not send a
 * second receipt. Idempotency lives at the transition, so it does not have to
 * be reinvented here.
 */

type AddressSnapshot = {
  name?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
};

async function load(orderId: string): Promise<OrderEmailData | null> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return null;

  const shipping = (order.shippingAddress ?? {}) as AddressSnapshot;

  return {
    orderNumber: order.orderNumber,
    email: order.email,
    items: order.items.map((item) => ({
      title: item.titleSnapshot,
      variant: item.variantSnapshot,
      quantity: item.quantity,
      unitPriceInPaise: item.unitPriceInPaise,
    })),
    subtotalInPaise: order.subtotalInPaise,
    shippingInPaise: order.shippingInPaise,
    discountInPaise: order.discountInPaise,
    taxInPaise: order.taxInPaise,
    totalInPaise: order.totalInPaise,
    shipping: {
      name: shipping.name ?? "",
      line1: shipping.line1 ?? "",
      line2: shipping.line2 ?? null,
      city: shipping.city ?? "",
      state: shipping.state ?? "",
      pincode: shipping.pincode ?? "",
    },
    isGift: order.isGift,
    giftRecipient: order.giftRecipient,
    giftMessage: order.giftMessage,
    requestedFor: order.requestedFor,
    siteUrl: SITE_URL,
  };
}

export async function notifyPaid(orderId: string) {
  const data = await load(orderId);
  if (!data) return;
  await send({
    to: data.email,
    subject: `Order ${data.orderNumber} is confirmed`,
    react: OrderConfirmation({ data }),
  });
}

export async function notifyPaymentFailed(orderId: string) {
  const data = await load(orderId);
  if (!data) return;
  await send({
    to: data.email,
    subject: `Payment for ${data.orderNumber} did not go through`,
    react: PaymentFailed({ data }),
  });
}

export async function notifyShipped(
  orderId: string,
  shipment: { courier?: string | null; awb?: string | null; trackingUrl?: string | null },
) {
  const data = await load(orderId);
  if (!data) return;
  await send({
    to: data.email,
    subject: `Order ${data.orderNumber} is on its way`,
    react: OrderShipped({ data, ...shipment }),
  });
}

export async function notifyDelivered(orderId: string) {
  const data = await load(orderId);
  if (!data) return;
  await send({
    to: data.email,
    subject: `Order ${data.orderNumber} has arrived`,
    react: OrderDelivered({ data }),
  });
}

export async function notifyRefunded(orderId: string) {
  const data = await load(orderId);
  if (!data) return;
  await send({
    to: data.email,
    subject: `Refund for ${data.orderNumber}`,
    react: OrderRefunded({ data }),
  });
}
