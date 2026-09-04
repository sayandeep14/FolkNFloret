import "../globals.css";
import "../cart.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { SceneMount } from "@/components/canvas/SceneMount";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";

/**
 * Everything expensive lives here rather than at the root: the WebGL canvas,
 * Lenis, the custom cursor. Shop routes are a sibling group and mount none of
 * it.
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <SmoothScroll>
      {/* Code-split and client-only: the type should paint before the WebGL. */}
      <SceneMount />
      <div className="grain" aria-hidden="true" />
      <Cursor />

        <SiteHeader />
        {children}
        <SiteFooter />
      </SmoothScroll>
      <CartDrawer />
    </CartProvider>
  );
}
