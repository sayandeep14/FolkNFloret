/**
 * Shapes shared by the cart's server actions and the client components that
 * render them. Like lib/catalog-types.ts, this file must not import anything
 * with a runtime dependency — a client component reaching in here for a type
 * would otherwise pull the database driver into the browser bundle.
 */
import type { OrderSummary } from "@/lib/pricing";

export type CartLine = {
  /** CartItem id — what the actions address. */
  id: string;
  variantId: string;
  productSlug: string;
  title: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  /** Re-read from the catalogue on every load, never from the cart row. */
  unitPriceInPaise: number;
  quantity: number;
  taxRateBps: number;
  /** What the customer could still add. */
  available: number;
};

export type CartView = {
  lines: CartLine[];
  summary: OrderSummary;
  discountCode: string | null;
  /** Set when a line was trimmed or dropped because stock moved under it. */
  notices: string[];
};

export const EMPTY_CART: CartView = {
  lines: [],
  summary: {
    subtotalInPaise: 0,
    discountInPaise: 0,
    shippingInPaise: 0,
    taxInPaise: 0,
    totalInPaise: 0,
    freeShippingShortfall: 0,
    itemCount: 0,
  },
  discountCode: null,
  notices: [],
};

export type CartResult =
  | { ok: true; cart: CartView }
  | { ok: false; error: string; cart: CartView };
