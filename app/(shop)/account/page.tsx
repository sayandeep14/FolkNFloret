import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, listOrders } from "@/lib/account";
import { ButtonLink, EmptyState, Badge } from "@/components/ui";
import { Money } from "@/components/ui/Money";

export const metadata: Metadata = { title: "Your orders — Folks & Florets" };

const TONE: Record<string, "neutral" | "gold" | "warn"> = {
  PENDING: "neutral",
  PAID: "gold",
  PROCESSING: "gold",
  SHIPPED: "gold",
  DELIVERED: "neutral",
  PAYMENT_FAILED: "warn",
  CANCELLED: "warn",
  REFUNDED: "warn",
};

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await listOrders(user.id);

  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        body="When you place one it will appear here, with its tracking."
        action={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
      />
    );
  }

  return (
    <ul className="order-list">
      {orders.map((order) => (
        <li key={order.id}>
          <Link href={`/account/orders/${order.orderNumber}`}>
            <span className="order-list__no">{order.orderNumber}</span>
            <span className="order-list__date">
              {(order.placedAt ?? order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="order-list__items">
              {order.items.length} {order.items.length === 1 ? "piece" : "pieces"}
            </span>
            <Badge tone={TONE[order.status] ?? "neutral"}>
              {order.status.toLowerCase().replace("_", " ")}
            </Badge>
            <span className="order-list__total">
              <Money paise={order.totalInPaise} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
