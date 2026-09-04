import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentStaff } from "@/lib/staff";
import { Money } from "@/components/ui/Money";

export const metadata: Metadata = { title: "Packing slip", robots: { index: false } };
export const dynamic = "force-dynamic";

type Snapshot = {
  name?: string; line1?: string; line2?: string | null; landmark?: string | null;
  city?: string; state?: string; pincode?: string; phone?: string;
};

/**
 * Goes in the box. Printable, and **prices are omitted whenever the order is a
 * gift with prices hidden** — the recipient opens this, and a receipt showing
 * what someone spent on them is the one thing a gifting house must never do.
 */
export default async function PackingSlipPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const staff = await currentStaff();
  if (!staff) redirect("/signin?callbackUrl=/studio");

  const { orderNumber } = await params;
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const shipping = (order.shippingAddress ?? {}) as Snapshot;
  const showPrices = !(order.isGift && order.giftHidePrices);

  return (
    <article className="slip">
      <header>
        <div>
          <p className="slip__mark">Folks &amp; Florets</p>
          <p className="slip__tag">The Art of Keeping</p>
        </div>
        <div className="slip__meta">
          <p>{order.orderNumber}</p>
          <p>
            {(order.placedAt ?? order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
      </header>

      <section className="slip__to">
        <h2>Deliver to</h2>
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
      </section>

      <table className="slip__items">
        <thead>
          <tr>
            <th>Piece</th>
            <th>SKU</th>
            <th>Qty</th>
            {showPrices ? <th>Value</th> : null}
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.titleSnapshot}
                {item.variantSnapshot ? <span> — {item.variantSnapshot}</span> : null}
              </td>
              <td>{item.skuSnapshot}</td>
              <td>{item.quantity}</td>
              {showPrices ? (
                <td>
                  <Money paise={item.unitPriceInPaise * item.quantity} />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
        {showPrices ? (
          <tfoot>
            <tr>
              <td colSpan={3}>Total, including GST</td>
              <td>
                <Money paise={order.totalInPaise} />
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>

      {order.isGift && order.giftMessage ? (
        <section className="slip__gift">
          <h2>Card message — write by hand</h2>
          <blockquote>{order.giftMessage}</blockquote>
          {order.giftRecipient ? <p>For {order.giftRecipient}</p> : null}
        </section>
      ) : null}

      {!showPrices ? (
        <p className="slip__note">
          Gift order — no prices on this slip and none in the parcel.
        </p>
      ) : null}

      <footer className="slip__footer">
        <p>
          Preserved botanicals: keep dry, away from direct sun. Candles: trim the
          wick to 5mm, never leave burning unattended.
        </p>
        <p>The Botanical Studio, Kotagiri, Nilgiris</p>
      </footer>
    </article>
  );
}
