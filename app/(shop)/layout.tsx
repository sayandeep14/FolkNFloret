import "../shop.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/**
 * No canvas, no Lenis, no custom cursor. Shop routes scroll natively so that
 * forms, validation focus and the browser's own restore-scroll all behave.
 */
export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="shop">
      <SiteHeader variant="solid" />
      <main className="shop__main" id="top">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
