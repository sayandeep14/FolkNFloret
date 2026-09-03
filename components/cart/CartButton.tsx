"use client";

import { useCart } from "@/components/cart/CartProvider";

/** The bag in the header. Opens the drawer rather than navigating, so a
 *  customer never loses the page they were reading. */
export function CartButton() {
  const { count, openBag } = useCart();

  return (
    <button
      type="button"
      className="site-header__tool site-header__bag"
      onClick={openBag}
      aria-label={count ? `Your bag, ${count} item${count === 1 ? "" : "s"}` : "Your bag"}
      data-cursor
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5.4 8h13.2l-1.1 12H6.5z" />
        <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
      </svg>
      {count > 0 ? (
        <span className="site-header__count" aria-hidden="true">
          {count}
        </span>
      ) : null}
    </button>
  );
}
