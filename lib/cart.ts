import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import { summarise } from "@/lib/pricing";
import { EMPTY_CART, type CartLine, type CartView } from "@/lib/cart-types";

export const CART_COOKIE = "ff_cart";
const CART_TTL_DAYS = 30;

/**
 * The cookie carries a 256-bit random token and nothing else. It is not signed
 * because there is nothing in it to trust: the token is looked up in the
 * database, so a forged one resolves to no cart rather than to someone else's.
 * Signing would only let us reject garbage a millisecond earlier, which is a
 * rate-limiting problem, not a cryptography one.
 */
function newToken() {
  return randomBytes(32).toString("base64url");
}

const cartInclude = {
  discountCode: true,
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          product: { include: { images: { take: 1, orderBy: { position: "asc" } } } },
          components: { include: { componentVariant: true } },
        },
      },
    },
  },
} as const;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;
type ItemRow = CartRow["items"][number];

/** Mirrors lib/catalog: a bundle is limited by its scarcest component. */
function availabilityOf(item: ItemRow): number {
  const own = Math.max(0, item.variant.stockOnHand - item.variant.stockReserved);
  if (!item.variant.product.isBundle) return own;
  return item.variant.components.reduce(
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
  );
}

function discountFor(cart: CartRow, subtotal: number): number {
  const code = cart.discountCode;
  if (!code || !code.active) return 0;
  const now = new Date();
  if (code.startsAt && code.startsAt > now) return 0;
  if (code.endsAt && code.endsAt < now) return 0;
  if (code.minSubtotalInPaise && subtotal < code.minSubtotalInPaise) return 0;
  if (code.usageLimit !== null && code.usedCount >= code.usageLimit) return 0;

  return code.type === "PERCENT"
    ? Math.round((subtotal * code.value) / 10000)
    : code.value;
}

/**
 * Builds the view, re-pricing every line from the catalogue and trimming any
 * that stock has moved under. The cached `unitPriceInPaise` on the row is for
 * display history only and is never what the customer is charged — a price
 * edited in the database has to change the cart on the next load, or the
 * store can be made to honour a price it no longer offers.
 */
async function toView(cart: CartRow): Promise<CartView> {
  const notices: string[] = [];
  const lines: CartLine[] = [];
  const removals: string[] = [];
  const trims: { id: string; quantity: number }[] = [];

  for (const item of cart.items) {
    const available = availabilityOf(item);
    const name = item.variant.name
      ? `${item.variant.product.title} — ${item.variant.name}`
      : item.variant.product.title;

    if (available <= 0) {
      notices.push(`${name} sold out and has been removed.`);
      removals.push(item.id);
      continue;
    }

    const quantity = Math.min(item.quantity, available);
    if (quantity !== item.quantity) {
      notices.push(`Only ${available} of ${name} left — your bag was adjusted.`);
      trims.push({ id: item.id, quantity });
    }

    lines.push({
      id: item.id,
      variantId: item.variantId,
      productSlug: item.variant.product.slug,
      title: item.variant.product.title,
      variantName: item.variant.name,
      sku: item.variant.sku,
      image: item.variant.product.images[0]?.url ?? null,
      unitPriceInPaise: item.variant.priceInPaise,
      quantity,
      taxRateBps: item.variant.taxRateBps,
      available,
    });
  }

  // Persist the corrections so the next read is quiet rather than repeating
  // the same notice forever.
  if (removals.length) {
    await db.cartItem.deleteMany({ where: { id: { in: removals } } });
  }
  for (const trim of trims) {
    await db.cartItem.update({
      where: { id: trim.id },
      data: { quantity: trim.quantity },
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.unitPriceInPaise * l.quantity, 0);

  return {
    lines,
    summary: summarise(lines, { discountInPaise: discountFor(cart, subtotal) }),
    discountCode: cart.discountCode?.code ?? null,
    notices,
  };
}

/** Read-only. Never creates a cart, so it is safe in a page render. */
export async function readCart(): Promise<CartView> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return EMPTY_CART;

  const cart = await db.cart.findUnique({
    where: { token },
    include: cartInclude,
  });
  if (!cart || cart.status !== "ACTIVE") return EMPTY_CART;

  return toView(cart);
}

/**
 * Finds or creates the cart and sets the cookie. Only callable from a Server
 * Action or Route Handler — Next forbids writing cookies during a render, and
 * that restriction is why this is separate from readCart.
 */
export async function getWritableCart(): Promise<CartRow> {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value;

  if (token) {
    const existing = await db.cart.findUnique({
      where: { token },
      include: cartInclude,
    });
    if (existing && existing.status === "ACTIVE") return existing;
  }

  const created = await db.cart.create({
    data: {
      token: newToken(),
      expiresAt: new Date(Date.now() + CART_TTL_DAYS * 864e5),
    },
    include: cartInclude,
  });

  jar.set(CART_COOKIE, created.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_TTL_DAYS * 86400,
  });

  return created;
}

export async function reload(cartId: string): Promise<CartView> {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
  return cart ? toView(cart) : EMPTY_CART;
}

export async function availabilityOfVariant(variantId: string): Promise<number> {
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
      components: { include: { componentVariant: true } },
    },
  });
  if (!variant) return 0;

  const own = Math.max(0, variant.stockOnHand - variant.stockReserved);
  if (!variant.product.isBundle) return own;
  return variant.components.reduce(
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
  );
}

/**
 * Moves a guest cart onto an account at sign-in. Lines are merged rather than
 * replaced: someone who filled a bag signed-out and had one waiting from last
 * week should end up with both.
 */
export async function mergeIntoUser(userId: string): Promise<void> {
  const token = (await cookies()).get(CART_COOKIE)?.value;
  if (!token) return;

  const guest = await db.cart.findUnique({ where: { token }, include: { items: true } });
  if (!guest || guest.userId === userId) return;

  const existing = await db.cart.findFirst({
    where: { userId, status: "ACTIVE", NOT: { id: guest.id } },
    include: { items: true },
  });

  if (!existing) {
    await db.cart.update({ where: { id: guest.id }, data: { userId } });
    return;
  }

  for (const item of guest.items) {
    const match = existing.items.find((i) => i.variantId === item.variantId);
    if (match) {
      await db.cartItem.update({
        where: { id: match.id },
        data: { quantity: match.quantity + item.quantity },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: existing.id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPriceInPaise: item.unitPriceInPaise,
        },
      });
    }
  }

  await db.cart.update({
    where: { id: guest.id },
    data: { status: "ABANDONED" },
  });
  (await cookies()).set(CART_COOKIE, existing.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_TTL_DAYS * 86400,
  });
}
