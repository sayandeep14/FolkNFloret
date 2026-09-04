import "../shop.css";
import "../cart.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";

/**
 * No canvas, no Lenis, no custom cursor. Shop routes scroll natively so that
 * forms, validation focus and the browser's own restore-scroll all behave.
 */
export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <div className="shop">
        <SiteHeader variant="solid" />
        <main className="shop__main" id="top">
          {children}
        </main>
        <SiteFooter />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
