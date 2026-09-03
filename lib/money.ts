/**
 * Money is an integer number of paise, everywhere, always. Never a float —
 * ₹1,450.55 is 145055, and a Number that has been through a division is not
 * a price. Nothing but this module formats currency, so a change of locale or
 * of currency is one edit rather than a search.
 */

const formatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const withPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Whole rupees drop their decimals: "₹1,450" reads as a price, "₹1,450.00"
 * reads as an invoice line. Anything with paise keeps them, because hiding
 * them would make a total look wrong against its parts.
 */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return paise % 100 === 0 ? formatter.format(rupees) : withPaise.format(rupees);
}

/** A price range, collapsed when both ends agree. */
export function formatPaiseRange(from: number, to: number): string {
  return from === to
    ? formatPaise(from)
    : `${formatPaise(from)} – ${formatPaise(to)}`;
}
