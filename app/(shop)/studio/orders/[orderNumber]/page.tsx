import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentStaff } from "@/lib/staff";
import { Badge, Breadcrumb } from "@/components/ui";
import { Money } from "@/components/ui/Money";
import { FulfilPanel } from "@/components/studio/FulfilPanel";

export const metadata: Metadata = { title: "Order — Studio" };
export const dynamic = "force-dynamic";

type Snapshot = {
  name?: string; line1?: string; line2?: string | null; landmark?: string | null;
  city?: string; state?: string; pincode?: string; phone?: string;
};

export default async function StudioOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const staff = await currentStaff();
  if (!staff) redirect("/signin?callbackUrl=/studio");

  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true, shipments: true, payments: true },
  });
  if (!order) notFound();

  const shipping = (order.shippingAddress ?? {}) as Snapshot;

  return (
    <>
      <Breadcrumb trail={[{ label: "Studio", href: "/studio" }, { label: order.orderNumber }]} />

      <div className="order">
        <section className="order__lines">
          <header className="order__head">
            <h1 className="order__number">{order.orderNumber}</h1>
            <Badge>{order.status.toLowerCase().replace(/_/g, " ")}</Badge>
            {order.isGift ? <Badge tone="gold">Gift</Badge> : null}
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
              <h3>Gift instructions</h3>
              {order.giftRecipient ? <p>For {order.giftRecipient}</p> : null}
              {order.giftMessage ? <blockquote>{order.giftMessage}</blockquote> : null}
              <p>
                {order.giftHidePrices
                  ? "No prices in the parcel."
                  : "Prices may be included."}
              </p>
              {order.requestedFor ? (
                <p>
                  Requested for{" "}
                  {order.requestedFor.toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="cart-page__note">
            <Link href={`/studio/orders/${order.orderNumber}/packing-slip`}>
              Open the packing slip →
            </Link>
          </p>
        </section>

        <aside className="order__aside">
          <h3>Ship to</h3>
          <address>
            {shipping.name}
            <br />
            {shipping.line1}
            {shipping.line2 ? (<><br />{shipping.line2}</>) : null}
            {shipping.landmark ? (<><br />Near {shipping.landmark}</>) : null}
            <br />
            {shipping.city}, {shipping.state} {shipping.pincode}
            <br />
            {shipping.phone}
          </address>

          <h3>Contact</h3>
          <p>
            {order.email}
            {order.phone ? (<><br />{order.phone}</>) : null}
          </p>

          <FulfilPanel
            orderNumber={order.orderNumber}
            status={order.status}
            shipment={order.shipments[0] ?? null}
          />
        </aside>
      </div>
    </>
  );
}
