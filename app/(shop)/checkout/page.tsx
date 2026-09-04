import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { readCart } from "@/lib/cart";
import { Breadcrumb } from "@/components/ui";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Checkout — Folks & Florets" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const cart = await readCart();
  // Nothing to buy, nothing to fill in.
  if (!cart.lines.length) redirect("/cart");

  const session = await auth();
  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        include: { addresses: { orderBy: { isDefault: "desc" }, take: 1 } },
      })
    : null;

  return (
    <>
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Your bag", href: "/cart" },
          { label: "Checkout" },
        ]}
      />
      <CheckoutForm
        cart={cart}
        defaults={{
          email: user?.email ?? "",
          phone: user?.phone ?? user?.addresses[0]?.phone ?? "",
          address: user?.addresses[0] ?? null,
        }}
        signedIn={Boolean(user)}
      />
    </>
  );
}
