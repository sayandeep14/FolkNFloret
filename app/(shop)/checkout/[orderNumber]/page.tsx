import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Breadcrumb, Badge } from "@/components/ui";
import { Money } from "@/components/ui/Money";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { RESERVATION_MINUTES } from "@/lib/checkout";

export const metadata: Metadata = { title: "Your order — Folks & Florets" };
export const dynamic = "force-dynamic";

/**
 * The order exists and holds its stock; the money does not yet. Phase 7 puts
 * Razorpay Checkout on this page. Until then it is an honest holding state
 * rather than a fake success.
 */
export default async function PendingOrderPage({
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

  // A server-rendered countdown is stale the moment it is sent, and reading
  // the clock during render is impure. The expiry time itself is a fact.
  const heldUntil = order.reservationExpiresAt?.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <Breadcrumb
        trail={[{ label: "Home", href: "/" }, { label: order.orderNumber }]}
      />

      <div className="order">
        <section className="order__lines">
          <header className="order__head">
            <h1 className="order__number">{order.orderNumber}</h1>
            <Badge tone={order.status === "PENDING" ? "gold" : "neutral"}>
              {order.status.toLowerCase().replace(/_/g, " ")}
            </Badge>
          </header>

          <p className="lede">
            Your order is reserved and your pieces are held.
            {order.status === "PENDING"
              ? ` Payment opens shortly — the hold lasts ${RESERVATION_MINUTES} minutes${
                  heldUntil ? `, until ${heldUntil}` : ""
                }.`
              : ""}
          </p>

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

          {/* Deliberately does not claim an email was sent: transactional mail
              is Phase 8, and a receipt that never arrives is worse than one
              that was never promised. */}
          <p className="cart-page__note">
            Keep this number — {order.orderNumber}. Your receipt will go to{" "}
            {order.email} once payment is taken.
          </p>
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
