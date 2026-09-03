import type { Metadata } from "next";
import { readCart } from "@/lib/cart";
import { Breadcrumb } from "@/components/ui";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const metadata: Metadata = { title: "Your bag — Folks & Florets" };

/** Reads the cookie, so it can never be static. */
export const dynamic = "force-dynamic";

export default async function CartPage() {
  // Server-rendered so the bag is real content on first paint — no spinner,
  // and it still reads correctly with JavaScript disabled.
  const cart = await readCart();

  return (
    <>
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Your bag" }]} />
      <CartPageClient initialCart={cart} />
    </>
  );
}
