import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  availabilityOfVariant,
  getWritableCart,
  readCart,
  reload,
} from "@/lib/cart";
import type { CartResult, CartView } from "@/lib/cart-types";

/**
 * The cart's whole write surface. Every operation returns the recomputed cart,
 * so the client never has to guess what happened and never has to hold its own
 * idea of the totals.
 *
 * The client sends a variant id and a quantity. It never sends a price — the
 * server re-reads that from the catalogue every time. A price arriving from a
 * browser is a price an attacker chose.
 *
 * These were Server Actions until they were found not to work: an action
 * invoked from a statically prerendered page runs on the server and then never
 * resolves on the client. Every add-to-bag happens on a product page, and
 * every product page is prerendered, so the bag was broken in production while
 * the database quietly filled with orphaned carts. Route handlers behave the
 * same on static and dynamic pages, so the transport moved and the logic did
 * not. See app/api/cart/route.ts.
 */

const MAX_PER_LINE = 10;

async function fail(message: string): Promise<CartResult> {
  return { ok: false, error: message, cart: await readCart() };
}

/**
 * A readable companion to the HttpOnly cart cookie, holding the item count and
 * nothing else, so the header badge paints without a request on pages that are
 * otherwise static. Advisory only — nothing is priced or authorised from it.
 */
async function publishCount(cart: CartView): Promise<void> {
  (await cookies()).set("ff_bag", String(cart.summary.itemCount), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 30 * 86400,
  });
}

async function ok(cartId: string): Promise<CartResult> {
  const cart = await reload(cartId);
  await publishCount(cart);
  return { ok: true, cart };
}

async function partial(cartId: string, error: string): Promise<CartResult> {
  const cart = await reload(cartId);
  await publishCount(cart);
  return { ok: false, error, cart };
}

export async function getCart(): Promise<CartView> {
  return readCart();
}

export async function addItem(
  variantId: string,
  quantity = 1,
): Promise<CartResult> {
  const wanted = Math.floor(quantity);
  if (!Number.isFinite(wanted) || wanted < 1) return fail("Choose a quantity.");

  // One read, not two. This used to fetch the variant and then call
  // availabilityOfVariant, which fetches the same row again — and every round
  // trip to the database is ~200ms from outside its region.
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
      components: { include: { componentVariant: true } },
    },
  });
  if (!variant || variant.product.status !== "ACTIVE") {
    return fail("That piece is no longer available.");
  }

  const own = Math.max(0, variant.stockOnHand - variant.stockReserved);
  const available = variant.product.isBundle
    ? variant.components.reduce(
        (limit, component) =>
          Math.min(
            limit,
            Math.floor(
              Math.max(
                0,
                component.componentVariant.stockOnHand -
                  component.componentVariant.stockReserved,
              ) / component.quantity,
            ),
          ),
        own,
      )
    : own;

  if (available <= 0) return fail("That piece has sold out.");

  const cart = await getWritableCart();
  const existing = cart.items.find((item) => item.variantId === variantId);
  const requested = (existing?.quantity ?? 0) + wanted;
  const capped = Math.min(requested, available, MAX_PER_LINE);

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: capped, unitPriceInPaise: variant.priceInPaise },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        variantId,
        quantity: capped,
        unitPriceInPaise: variant.priceInPaise,
      },
    });
  }

  if (capped < requested) {
    const why =
      available < MAX_PER_LINE
        ? `Only ${available} left, so your bag holds ${capped}.`
        : `We limit this to ${MAX_PER_LINE} per order.`;
    return partial(cart.id, why);
  }

  return ok(cart.id);
}

export async function updateQuantity(
  itemId: string,
  quantity: number,
): Promise<CartResult> {
  const cart = await getWritableCart();
  const item = cart.items.find((i) => i.id === itemId);
  // Scoped to this cart, so an item id from someone else's bag does nothing.
  if (!item) return fail("That is no longer in your bag.");

  const wanted = Math.floor(quantity);
  if (wanted <= 0) {
    await db.cartItem.delete({ where: { id: itemId } });
    return ok(cart.id);
  }

  const available = await availabilityOfVariant(item.variantId);
  if (available <= 0) {
    await db.cartItem.delete({ where: { id: itemId } });
    return partial(cart.id, "That piece sold out.");
  }

  const capped = Math.min(wanted, available, MAX_PER_LINE);
  await db.cartItem.update({ where: { id: itemId }, data: { quantity: capped } });

  if (capped < wanted) return partial(cart.id, `Only ${capped} available.`);
  return ok(cart.id);
}

export async function removeItem(itemId: string): Promise<CartResult> {
  const cart = await getWritableCart();
  if (!cart.items.some((i) => i.id === itemId)) {
    return fail("That is no longer in your bag.");
  }
  await db.cartItem.delete({ where: { id: itemId } });
  return ok(cart.id);
}

export async function applyDiscount(rawCode: string): Promise<CartResult> {
  const code = rawCode.trim().toUpperCase();
  const cart = await getWritableCart();

  if (!code) {
    await db.cart.update({ where: { id: cart.id }, data: { discountCodeId: null } });
    return ok(cart.id);
  }

  const discount = await db.discountCode.findUnique({ where: { code } });
  const now = new Date();
  const usable =
    discount &&
    discount.active &&
    (!discount.startsAt || discount.startsAt <= now) &&
    (!discount.endsAt || discount.endsAt >= now) &&
    (discount.usageLimit === null || discount.usedCount < discount.usageLimit);

  if (!usable) return fail("That code is not valid.");

  await db.cart.update({
    where: { id: cart.id },
    data: { discountCodeId: discount.id },
  });

  const updated = await reload(cart.id);
  // A code can be real but not yet earned — say which, rather than "invalid".
  if (updated.summary.discountInPaise === 0 && discount.minSubtotalInPaise) {
    return partial(
      cart.id,
      `That code applies to orders over ₹${(discount.minSubtotalInPaise / 100).toLocaleString("en-IN")}.`,
    );
  }
  await publishCount(updated);
  return { ok: true, cart: updated };
}
