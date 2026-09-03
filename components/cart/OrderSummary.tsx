import { Money } from "@/components/ui/Money";
import { FREE_SHIPPING_AT, type OrderSummary as Summary } from "@/lib/pricing";

/**
 * The one rendering of what an order costs. Cart, checkout and confirmation
 * all use this component, so the three can never disagree — which is the whole
 * reason the numbers are computed in lib/pricing rather than per page.
 */
export function OrderSummary({
  summary,
  discountCode,
  compact,
}: {
  summary: Summary;
  discountCode?: string | null;
  compact?: boolean;
}) {
  return (
    <div className={`summary${compact ? " summary--compact" : ""}`}>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>
            <Money paise={summary.subtotalInPaise} />
          </dd>
        </div>

        {summary.discountInPaise > 0 ? (
          <div className="summary__discount">
            <dt>Discount{discountCode ? ` · ${discountCode}` : ""}</dt>
            <dd>
              −<Money paise={summary.discountInPaise} />
            </dd>
          </div>
        ) : null}

        <div>
          <dt>Delivery</dt>
          <dd>
            {summary.shippingInPaise === 0 ? (
              "Complimentary"
            ) : (
              <Money paise={summary.shippingInPaise} />
            )}
          </dd>
        </div>

        <div className="summary__total">
          <dt>Total</dt>
          <dd>
            <Money paise={summary.totalInPaise} />
          </dd>
        </div>
      </dl>

      {/* Prices are GST-inclusive, the Indian retail norm, so the tax is shown
          as a component of the total and never added to it. */}
      <p className="summary__note">
        Includes GST of <Money paise={summary.taxInPaise} />.
      </p>

      {summary.freeShippingShortfall > 0 ? (
        <p className="summary__nudge">
          <Money paise={summary.freeShippingShortfall} /> more for complimentary
          delivery.
        </p>
      ) : summary.subtotalInPaise >= FREE_SHIPPING_AT ? (
        <p className="summary__nudge">Delivery is on us.</p>
      ) : null}
    </div>
  );
}
