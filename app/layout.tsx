import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import "./tokens.css";
import "./chrome.css";
import "./ui.css";
import "./cart.css";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";

export const metadata: Metadata = {
  // Absolute base for og:image and canonicals. Without it Next resolves them
  // against localhost and every shared link previews as broken.
  metadataBase: new URL(SITE_URL),
  title: "Folks & Florets — The Art of Keeping",
  description:
    "Preserved botanicals, hand-poured candles and estate provisions, composed into keepsake suites for the moments meant to be kept.",
};

/**
 * The root carries only what every route needs: the document, the fonts, the
 * tokens and the shared chrome styles. The marketing page's WebGL layer and
 * smooth scroll are mounted one level down, in its own route group, because
 * they must not run on a checkout page — Lenis fights native form scrolling,
 * and the pinned ScrollTriggers assume a page whose height never changes.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/*
          Loaded at runtime rather than via next/font, which fetches at build
          time and fails in an offline build environment.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@200;300;400;500&display=swap"
        />
      </head>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
