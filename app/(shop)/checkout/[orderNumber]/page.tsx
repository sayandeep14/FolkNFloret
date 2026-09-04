import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Breadcrumb, Badge } from "@/components/ui";
import { Money } from "@/components/ui/Money";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { RESERVATION_MINUTES } from "@/lib/checkout";
import { razorpayConfig, isTestMode } from "@/lib/razorpay";
import { PayButton } from "@/components/checkout/PayButton";

export const metadata: Metadata = { title: "Your order — Folks & Florets" };
export const dynamic = "force-dynamic";

/**
 * The order exists and holds its stock. This is where the money is taken.
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

  // Already settled: nothing to pay, so send them to the receipt.
  if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
    redirect(`/checkout/success/${order.orderNumber}`);
  }

  const configured = Boolean(razorpayConfig());
  const expired =
    order.reservationExpiresAt !== null && order.reservationExpiresAt < new Date();

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
            {expired
              ? "The hold on this order has expired and the pieces have gone back to the shop. Start again from your bag."
              : `Your pieces are held for ${RESERVATION_MINUTES} minutes${
                  heldUntil ? `, until ${heldUntil}` : ""
                }. Pay to confirm them.`}
          </p>

          {order.status === "PAYMENT_FAILED" ? (
            <p className="drawer__notice" role="status">
              That payment did not go through. Nothing has been charged, and
              your pieces are still held — try again below.
            </p>
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

          {/* Deliberately does not claim an email was sent: transactional mail
              is Phase 8, and a receipt that never arrives is worse than one
              that was never promised. */}
          <p className="cart-page__note">
            Keep this number — {order.orderNumber}. Your receipt will go to{" "}
            {order.email} once payment is taken.
          </p>
        </section>

        <aside className="order__aside">
          <h3>Pay</h3>
          <PayButton
            orderNumber={order.orderNumber}
            disabledReason={
              expired
                ? "The hold has expired — start again from your bag."
                : !configured
                  ? "Payments are not switched on for this deployment yet."
                  : undefined
            }
          />
          {configured && isTestMode() ? (
            <p className="cart-page__note">
              Test mode. Use the Razorpay test cards — no money moves.
            </p>
          ) : null}

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
