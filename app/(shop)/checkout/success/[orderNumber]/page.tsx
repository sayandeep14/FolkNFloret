import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Breadcrumb, ButtonLink } from "@/components/ui";
import { Money } from "@/components/ui/Money";
import { OrderSummary } from "@/components/cart/OrderSummary";

export const metadata: Metadata = { title: "Thank you — Folks & Florets" };
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  // The browser can arrive here a moment before the webhook lands, so this
  // reads the order rather than assuming success.
  const settled = order.status !== "PENDING" && order.status !== "PAYMENT_FAILED";

  return (
    <>
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: order.orderNumber }]} />

      <div className="order">
        <section className="order__lines">
          <p className="eyebrow">{settled ? "Thank you" : "Almost there"}</p>
          <h1 className="order__number">{order.orderNumber}</h1>

          <p className="lede">
            {settled
              ? `Your order is confirmed. A receipt is on its way to ${order.email}, and we will write again when it ships.`
              : "Your payment is being confirmed. This page updates on its own — refresh in a moment if it has not."}
          </p>

          {order.isGift ? (
            <div className="order__gift">
              <h3>Given as a gift</h3>
              {order.giftRecipient ? <p>For {order.giftRecipient}</p> : null}
              {order.giftMessage ? <blockquote>{order.giftMessage}</blockquote> : null}
              {order.giftHidePrices ? <p>No prices will travel with the parcel.</p> : null}
            </div>
          ) : null}

          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.titleSnapshot}
                  {item.variantSnapshot ? <em>{item.variantSnapshot}</em> : null}
                  <small>×{item.quantity}</small>
                </span>
                <Money paise={item.unitPriceInPaise * item.quantity} />
              </li>
            ))}
          </ul>

          <div className="actions">
            <ButtonLink href="/shop" variant="ghost">
              Keep looking
            </ButtonLink>
          </div>
        </section>

        <aside className="order__aside">
          <h3>Summary</h3>
          <OrderSummary
            summary={{
              subtotalInPaise: order.subtotalInPaise,
              discountInPaise: order.discountInPaise,
              shippingInPaise: order.shippingInPaise,
              taxInPaise: order.taxInPaise,
              totalInPaise: order.totalInPaise,
              freeShippingShortfall: 0,
              itemCount: order.items.reduce((n, i) => n + i.quantity, 0),
            }}
          />
        </aside>
      </div>
    </>
  );
}
