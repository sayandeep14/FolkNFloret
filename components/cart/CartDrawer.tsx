"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { CartLines, useOptimisticCart } from "@/components/cart/CartLines";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { ButtonLink } from "@/components/ui/Button";

export function CartDrawer() {
  const { cart: serverCart, open, closeBag, error, pending } = useCart();
  const { cart, setQuantity, remove } = useOptimisticCart(serverCart);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    returnTo.current = document.activeElement as HTMLElement | null;
    // Deferred a frame: moving focus in the same tick as the click that opened
    // the drawer races the browser's own focus handling.
    const frame = requestAnimationFrame(() => closeRef.current?.focus());

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeBag();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      returnTo.current?.focus();
    };
  }, [open, closeBag]);

  return (
    <div className={`drawer${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="drawer__scrim"
        aria-label="Close the bag"
        tabIndex={open ? 0 : -1}
        onClick={() => closeBag()}
      />

      <div
        ref={panelRef}
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        // Hidden from the tree entirely when closed, so nothing behind the
        // scrim is reachable by keyboard or screen reader. React 19 takes a
        // real boolean here; an empty string is read as false.
        inert={!open}
      >
        <header className="drawer__head">
          <h2>Your bag</h2>
          <button ref={closeRef} type="button" onClick={() => closeBag()} aria-label="Close">
            ✕
          </button>
        </header>

        {cart.notices.map((notice) => (
          <p key={notice} className="drawer__notice" role="status">
            {notice}
          </p>
        ))}
        {error ? (
          <p className="drawer__notice drawer__notice--error" role="alert">
            {error}
          </p>
        ) : null}

        {cart.lines.length ? (
          <>
            <div className="drawer__body">
              <CartLines
                cart={cart}
                onQuantity={setQuantity}
                onRemove={remove}
                onNavigate={() => closeBag()}
              />
            </div>
            <footer className="drawer__foot">
              <OrderSummary summary={cart.summary} discountCode={cart.discountCode} compact />
              <ButtonLink href="/cart" full onClick={() => closeBag()}>
                {pending ? "Updating…" : "View bag and check out"}
              </ButtonLink>
            </footer>
          </>
        ) : (
          <div className="drawer__empty">
            <p>Nothing kept yet.</p>
            <Link href="/shop" onClick={() => closeBag()}>
              Browse the collections
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
