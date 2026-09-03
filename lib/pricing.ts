/**
 * One place computes what an order costs. The cart, the checkout and the
 * confirmation all render the same object, so the three cannot disagree.
 *
 * Two conventions worth stating out loud, because everything below depends on
 * them and neither is universal:
 *
 * 1. **Prices are inclusive of GST.** That is the Indian retail norm — a shelf
 *    price of ₹1,450 is what the customer pays, and the tax is a component of
 *    it rather than an addition to it. So GST is *shown* on the summary but
 *    never *added* to the total. Getting this backwards inflates every price
 *    by 12–18% at the last step, which is the single most expensive place to
 *    surprise someone.
 *
 * 2. **Everything is an integer of paise**, and each line rounds once. Summing
 *    unrounded fractions and rounding at the end produces totals that differ
 *    from the sum of the lines shown, which customers do notice.
 */

/** Provisional. Phase 6 replaces this with real rates by weight and distance. */
export const FREE_SHIPPING_AT = 250000; // ₹2,500
export const FLAT_SHIPPING = 15000; // ₹150

export type PricedLine = {
  /** Unit price including GST, as re-read from the catalogue. */
  unitPriceInPaise: number;
  quantity: number;
  taxRateBps: number;
};

export type OrderSummary = {
  subtotalInPaise: number;
  discountInPaise: number;
  shippingInPaise: number;
  /** Included in the total, not added to it. */
  taxInPaise: number;
  totalInPaise: number;
  /** How much more to spend to cross the free-shipping line; 0 once past it. */
  freeShippingShortfall: number;
  itemCount: number;
};

export function lineTotal(line: PricedLine): number {
  return line.unitPriceInPaise * line.quantity;
}

/**
 * The GST already inside a tax-inclusive amount:
 *   gross − gross ÷ (1 + rate)
 */
function taxWithin(grossInPaise: number, rateBps: number): number {
  return Math.round(grossInPaise - grossInPaise / (1 + rateBps / 10000));
}

export function summarise(
  lines: PricedLine[],
  options: { discountInPaise?: number; shippingInPaise?: number } = {},
): OrderSummary {
  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  // Never let a discount exceed the goods; a negative total is a refund, not
  // a sale, and no code should be able to create one by accident.
  const discount = Math.min(Math.max(0, options.discountInPaise ?? 0), subtotal);

  const shipping =
    options.shippingInPaise ??
    (subtotal === 0 || subtotal - discount >= FREE_SHIPPING_AT ? 0 : FLAT_SHIPPING);

  // A discount reduces the tax inside the goods proportionally, because the
  // customer paid less for them. Applied per line so mixed rates stay right —
  // honey at 5% and chocolate at 18% in one bag is the normal case here.
  const keep = subtotal === 0 ? 1 : (subtotal - discount) / subtotal;
  const tax = lines.reduce(
    (sum, line) => sum + taxWithin(Math.round(lineTotal(line) * keep), line.taxRateBps),
    0,
  );

  const total = subtotal - discount + shipping;

  return {
    subtotalInPaise: subtotal,
    discountInPaise: discount,
    shippingInPaise: shipping,
    taxInPaise: tax,
    totalInPaise: total,
    freeShippingShortfall:
      subtotal === 0 ? 0 : Math.max(0, FREE_SHIPPING_AT - (subtotal - discount)),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
  };
}
