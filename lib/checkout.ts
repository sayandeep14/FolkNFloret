import "server-only";
import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { summarise } from "@/lib/pricing";
import { ORIGIN_STATE, type AddressInput } from "@/lib/address";
import type { CartView } from "@/lib/cart-types";

/** How long a pending order holds its stock before the sweep can take it back. */
export const RESERVATION_MINUTES = 15;

/**
 * Human-facing and quotable over the phone: FF-4K2H-8Q31. Deliberately not
 * sequential — a guessable order number lets anyone enumerate the day's trade
 * from the tracking page.
 */
function orderNumber(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0, I/1
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `FF-${block()}-${block()}`;
}

/**
 * Gives back stock held by pending orders that were never paid for.
 *
 * Called at the start of every checkout rather than on a timer: the moment
 * someone actually needs the stock is the moment worth reconciling it, and it
 * means the store is correct without depending on a cron existing yet. Phase 8
 * should also run it on a schedule so an idle shop still frees its shelves.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const expired = await db.order.findMany({
    where: { status: "PENDING", reservationExpiresAt: { lt: new Date() } },
    include: { items: true },
  });
  if (!expired.length) return 0;

  await db.$transaction([
    ...expired.flatMap((order) =>
      order.items
        .filter((item) => item.variantId)
        .map((item) =>
          db.productVariant.update({
            where: { id: item.variantId! },
            data: { stockReserved: { decrement: item.quantity } },
          }),
        ),
    ),
    db.order.updateMany({
      where: { id: { in: expired.map((o) => o.id) } },
      data: { status: "CANCELLED", reservationExpiresAt: null },
    }),
  ]);

  return expired.length;
}

export type PlaceOrderInput = {
  email: string;
  phone: string;
  shipping: AddressInput;
  billing: AddressInput;
  gift: {
    isGift: boolean;
    recipient?: string;
    message?: string;
    hidePrices: boolean;
    requestedFor?: Date;
  };
  userId?: string;
};

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; error: string };

/**
 * Turns a cart into a PENDING order and holds its stock.
 *
 * The order exists *before* payment on purpose. A customer who pays and then
 * closes the tab must still end up with an order, and that is only possible if
 * the order is already there for the webhook to find.
 *
 * Everything that touches stock happens in one transaction with a conditional
 * update per line — `updateMany` with a `stockOnHand >= reserved + qty` guard
 * returns a count, so two simultaneous checkouts for the last suite cannot both
 * succeed. Checking availability first and writing after would be a race.
 */
export async function placeOrder(
  cart: CartView,
  cartId: string,
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  if (!cart.lines.length) return { ok: false, error: "Your bag is empty." };

  const summary = summarise(cart.lines, {
    discountInPaise: cart.summary.discountInPaise,
  });

  const variants = await db.productVariant.findMany({
    where: { id: { in: cart.lines.map((l) => l.variantId) } },
    include: { product: { include: { images: { take: 1, orderBy: { position: "asc" } } } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60_000);
  let number = orderNumber();

  try {
    const created = await db.$transaction(async (tx) => {
      for (const line of cart.lines) {
        // Conditional: only reserves if the stock is still there to reserve.
        const held = await tx.productVariant.updateMany({
          where: {
            id: line.variantId,
            stockOnHand: { gte: line.quantity },
          },
          data: { stockReserved: { increment: line.quantity } },
        });
        if (held.count === 0) throw new Error(`OUT_OF_STOCK:${line.title}`);

        const after = await tx.productVariant.findUniqueOrThrow({
          where: { id: line.variantId },
          select: { stockOnHand: true, stockReserved: true },
        });
        if (after.stockReserved > after.stockOnHand) {
          throw new Error(`OUT_OF_STOCK:${line.title}`);
        }
      }

      // Retry once on the astronomically unlikely order-number collision.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          return await tx.order.create({
            data: {
              orderNumber: number,
              cartId,
              userId: input.userId ?? null,
              email: input.email,
              phone: input.phone,
              status: "PENDING",
              subtotalInPaise: summary.subtotalInPaise,
              shippingInPaise: summary.shippingInPaise,
              taxInPaise: summary.taxInPaise,
              discountInPaise: summary.discountInPaise,
              totalInPaise: summary.totalInPaise,
              shippingAddress: input.shipping,
              billingAddress: input.billing,
              isGift: input.gift.isGift,
              giftRecipient: input.gift.recipient ?? null,
              giftMessage: input.gift.message ?? null,
              giftHidePrices: input.gift.hidePrices,
              requestedFor: input.gift.requestedFor ?? null,
              reservationExpiresAt: expiresAt,
              items: {
                create: cart.lines.map((line) => {
                  const variant = byId.get(line.variantId);
                  return {
                    variantId: line.variantId,
                    titleSnapshot: line.title,
                    variantSnapshot: line.variantName,
                    skuSnapshot: line.sku,
                    hsnSnapshot: variant?.hsnCode ?? null,
                    imageSnapshot: variant?.product.images[0]?.url ?? line.image,
                    unitPriceInPaise: line.unitPriceInPaise,
                    quantity: line.quantity,
                    taxRateBps: line.taxRateBps,
                  };
                }),
              },
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (attempt === 0 && message.includes("orderNumber")) {
            number = orderNumber();
            continue;
          }
          throw error;
        }
      }
      throw new Error("ORDER_NUMBER");
    });

    // The cart stays ACTIVE until the money arrives: a failed payment has to
    // leave the customer with their bag intact, not an empty shop and no
    // order. markPaid retires it, using the id recorded above.
    return { ok: true, orderNumber: created.orderNumber };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("OUT_OF_STOCK:")) {
      return {
        ok: false,
        error: `${message.slice("OUT_OF_STOCK:".length)} sold out while you were checking out. Your bag has been updated.`,
      };
    }
    console.error("[checkout] could not place order:", error);
    return { ok: false, error: "We could not start that order. Please try again." };
  }
}

/** Same state means CGST + SGST; different means IGST. Same total either way. */
export function taxSplit(destinationState: string) {
  return destinationState === ORIGIN_STATE ? "CGST_SGST" : "IGST";
}
