import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentStaff } from "@/lib/staff";
import { Badge, Breadcrumb, EmptyState } from "@/components/ui";
import { Money } from "@/components/ui/Money";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };
export const dynamic = "force-dynamic";

/** The orders queue. Phase 9 turns this into a proper admin. */
export default async function StudioPage() {
  const staff = await currentStaff();
  if (!staff) redirect("/signin?callbackUrl=/studio");

  const orders = await db.order.findMany({
    where: { status: { notIn: ["PENDING", "CANCELLED"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });

  return (
    <>
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Studio" }]} />
      <header className="shop__head">
        <p className="eyebrow">Studio</p>
        <h1 className="display display--md">Orders to fulfil</h1>
      </header>

      {orders.length ? (
        <ul className="order-list">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/studio/orders/${order.orderNumber}`}>
                <span className="order-list__no">{order.orderNumber}</span>
                <span className="order-list__date">
                  {(order.placedAt ?? order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short",
                  })}
                </span>
                <span className="order-list__items">
                  {order.items.length} {order.items.length === 1 ? "piece" : "pieces"}
                  {order.isGift ? " · gift" : ""}
                </span>
                <Badge tone={order.status === "PAID" ? "gold" : "neutral"}>
                  {order.status.toLowerCase().replace(/_/g, " ")}
                </Badge>
                <span className="order-list__total">
                  <Money paise={order.totalInPaise} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nothing to pack" body="Paid orders appear here." />
      )}
    </>
  );
}
