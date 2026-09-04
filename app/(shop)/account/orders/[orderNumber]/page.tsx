import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser, getOrder } from "@/lib/account";
import { Badge, Breadcrumb } from "@/components/ui";
import { Money } from "@/components/ui/Money";
import { OrderSummary } from "@/components/cart/OrderSummary";

export const metadata: Metadata = { title: "Order — Folks & Florets" };

type Snapshot = {
  name: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireUser();
  const order = await getOrder(user.id, (await params).orderNumber);
  if (!order) notFound();

  // Frozen at purchase, not a live relation — what was shipped to must not
  // change when the address book does.
  const shipping = order.shippingAddress as unknown as Snapshot;
  const shipment = order.shipments[0];

  return (
    <>
      <Breadcrumb
        trail={[
          { label: "Account", href: "/account" },
          { label: order.orderNumber },
        ]}
      />

      <div className="order">
        <section className="order__lines">
          <header className="order__head">
            <h2>{order.orderNumber}</h2>
            <Badge>{order.status.toLowerCase().replace("_", " ")}</Badge>
          </header>

          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.titleSnapshot}
                  {item.variantSnapshot ? <em>{item.variantSnapshot}</em> : null}
                  <small>
                    {item.skuSnapshot} · ×{item.quantity}
                  </small>
                </span>
                <Money paise={item.unitPriceInPaise * item.quantity} />
              </li>
            ))}
          </ul>

          {order.isGift ? (
            <div className="order__gift">
              <h3>Given as a gift</h3>
              {order.giftRecipient ? <p>For {order.giftRecipient}</p> : null}
              {order.giftMessage ? <blockquote>{order.giftMessage}</blockquote> : null}
            </div>
          ) : null}
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

          <h3>Delivered to</h3>
          <address>
            {shipping.name}
            <br />
            {shipping.line1}
            {shipping.line2 ? (
              <>
                <br />
                {shipping.line2}
              </>
            ) : null}
            <br />
            {shipping.city}, {shipping.state} {shipping.pincode}
            <br />
            {shipping.phone}
          </address>

          {shipment ? (
            <>
              <h3>Shipment</h3>
              <p>
                {shipment.courier ?? shipment.provider}
                {shipment.awb ? ` · ${shipment.awb}` : ""}
                <br />
                {shipment.status.toLowerCase().replace(/_/g, " ")}
              </p>
              {shipment.trackingUrl ? (
                <a href={shipment.trackingUrl} rel="noreferrer noopener" target="_blank">
                  Track this parcel
                </a>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>
    </>
  );
}
