"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { CartLines, useOptimisticCart } from "@/components/cart/CartLines";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Button, ButtonLink, EmptyState } from "@/components/ui";
import type { CartView } from "@/lib/cart-types";

export function CartPageClient({ initialCart }: { initialCart: CartView }) {
  const { cart: serverCart, loaded, applyDiscount, pending, error } = useCart();
  const [code, setCode] = useState(initialCart.discountCode ?? "");

  // The page was server-rendered with a real bag, so it starts from that and
  // switches to the provider's copy the moment an action returns one. No
  // effect, no seeding call, and no flash of "nothing kept yet" over a bag
  // that demonstrably is not empty.
  const { cart, setQuantity, remove } = useOptimisticCart(
    loaded ? serverCart : initialCart,
  );

  if (!cart.lines.length) {
    return (
      <EmptyState
        eyebrow="Your bag"
        title="Nothing kept yet"
        body="The collections are worth a look — aromatics, provisions and preserved botanicals."
        action={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
      />
    );
  }

  return (
    <div className="cart-page">
      <section className="cart-page__lines">
        <h1 className="display display--md">Your bag</h1>

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

        <CartLines cart={cart} onQuantity={setQuantity} onRemove={remove} />
      </section>

      <aside className="cart-page__summary">
        <h2>Summary</h2>
        <OrderSummary summary={cart.summary} discountCode={cart.discountCode} />

        <form
          className="cart-page__code"
          onSubmit={(event) => {
            event.preventDefault();
            applyDiscount(code);
          }}
        >
          <label htmlFor="discount">Discount code</label>
          <div>
            <input
              id="discount"
              className="ui-input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter a code"
              autoComplete="off"
            />
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>
              Apply
            </Button>
          </div>
        </form>

        {/* Checkout is Phase 6. Rendered so the layout and focus order are
            settled; wiring it is a change of href, not of markup. */}
        <Button full disabled>
          Checkout
        </Button>
        <p className="cart-page__note">
          Checkout opens next. Prices include GST; delivery is calculated on the
          bag total.
        </p>
      </aside>
    </div>
  );
}
