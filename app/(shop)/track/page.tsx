import type { Metadata } from "next";
import { headers } from "next/headers";
import { Badge, Breadcrumb } from "@/components/ui";
import { Money } from "@/components/ui/Money";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { TrackForm } from "@/components/checkout/TrackForm";
import { findOrderForTracking } from "@/lib/tracking";

export const metadata: Metadata = { title: "Track an order — Folks & Florets" };
export const dynamic = "force-dynamic";

const STAGES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>;
}) {
  const { order: orderNumber, email } = await searchParams;

  // Links in our own emails carry both, so a customer arriving from one lands
  // straight on their order rather than on a form they have to fill in again.
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const result =
    orderNumber && email
      ? await findOrderForTracking(orderNumber, email, ip)
      : null;

  const order = result?.ok ? result.order : null;
  const shipment = order?.shipments[0];
  const stageIndex = order ? STAGES.indexOf(order.status as (typeof STAGES)[number]) : -1;

  return (
    <>
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Track an order" }]} />

      {!order ? (
        <div className="auth">
          <p className="eyebrow eyebrow--center">Orders</p>
          <h1 className="display display--md">Track an order</h1>
          <p className="lede lede--center">
            Your order number and the email it was placed with. No account
            needed.
          </p>
          <TrackForm
            notFound={result !== null && !result.ok}
            defaults={{ order: orderNumber ?? "", email: email ?? "" }}
          />
        </div>
      ) : (
        <div className="order">
          <section className="order__lines">
            <header className="order__head">
              <h1 className="order__number">{order.orderNumber}</h1>
              <Badge tone={order.status === "DELIVERED" ? "neutral" : "gold"}>
                {order.status.toLowerCase().replace(/_/g, " ")}
              </Badge>
            </header>

            {stageIndex >= 0 ? (
              <ol className="track-stages">
                {STAGES.map((stage, index) => (
                  <li key={stage} data-done={index <= stageIndex ? "true" : undefined}>
                    <span />
                    {stage === "PAID"
                      ? "Confirmed"
                      : stage.charAt(0) + stage.slice(1).toLowerCase()}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="lede">
                {order.status === "PENDING"
                  ? "This order is waiting on payment."
                  : `This order is ${order.status.toLowerCase().replace(/_/g, " ")}.`}
              </p>
            )}

            <ul>
              {order.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.titleSnapshot}
                    {item.variantSnapshot ? <em>{item.variantSnapshot}</em> : null}
                    <small>×{item.quantity}</small>
                  </span>
                  {/* A gift order hides its prices from whoever holds the
                      number — which may well be the recipient. */}
                  {order.giftHidePrices && order.isGift ? null : (
                    <Money paise={item.unitPriceInPaise * item.quantity} />
                  )}
                </li>
              ))}
            </ul>
          </section>

          <aside className="order__aside">
            {shipment ? (
              <>
                <h3>Shipment</h3>
                <p>
                  {shipment.courier ?? shipment.provider}
                  {shipment.awb ? (
                    <>
                      <br />
                      {shipment.awb}
                    </>
                  ) : null}
                  <br />
                  {shipment.status.toLowerCase().replace(/_/g, " ")}
                </p>
                {shipment.trackingUrl ? (
                  <a href={shipment.trackingUrl} target="_blank" rel="noreferrer noopener">
                    Track the parcel
                  </a>
                ) : null}
              </>
            ) : null}

            {order.isGift && order.giftHidePrices ? null : (
              <>
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
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
