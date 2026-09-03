"use client";

import { startTransition, useOptimistic } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { Money } from "@/components/ui/Money";
import { summarise } from "@/lib/pricing";
import type { CartView } from "@/lib/cart-types";

/**
 * The optimistic layer sits here rather than in the provider, because this is
 * the component that knows which cart it is rendering — the drawer shows the
 * provider's, the cart page shows the one the server already sent.
 *
 * Edits only ever change a quantity, so the totals are recomputed with the same
 * function the server uses. Nothing is invented; the server's answer replaces
 * the whole view a moment later.
 */
function applyOptimistic(cart: CartView, edit: { id: string; quantity: number }): CartView {
  const lines = cart.lines
    .map((line) => (line.id === edit.id ? { ...line, quantity: edit.quantity } : line))
    .filter((line) => line.quantity > 0);

  return {
    ...cart,
    lines,
    summary: summarise(lines, { discountInPaise: cart.summary.discountInPaise }),
  };
}

export function useOptimisticCart(cart: CartView) {
  const { setQuantity, remove } = useCart();
  const [optimistic, edit] = useOptimistic(cart, applyOptimistic);

  return {
    cart: optimistic,
    setQuantity: (id: string, quantity: number) => {
      // Inside a transition so React keeps the optimistic value on screen
      // until the server's answer replaces it.
      startTransition(() => edit({ id, quantity }));
      return setQuantity(id, quantity);
    },
    remove: (id: string) => {
      startTransition(() => edit({ id, quantity: 0 }));
      return remove(id);
    },
  };
}

export function CartLines({
  cart,
  onQuantity,
  onRemove,
  onNavigate,
}: {
  cart: CartView;
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onNavigate?: () => void;
}) {
  const { pending } = useCart();

  return (
    <ul className="cart-lines">
      {cart.lines.map((line) => (
        <li key={line.id} className="cart-line">
          <Link
            className="cart-line__image"
            href={`/products/${line.productSlug}`}
            onClick={onNavigate}
            tabIndex={-1}
            aria-hidden="true"
          >
            {line.image ? (
              <Image src={line.image} alt="" width={800} height={1000} sizes="80px" unoptimized />
            ) : null}
          </Link>

          <div className="cart-line__body">
            <Link href={`/products/${line.productSlug}`} onClick={onNavigate}>
              {line.title}
            </Link>
            {line.variantName ? <p>{line.variantName}</p> : null}

            <div className="cart-line__controls">
              <div
                className="quantity quantity--sm"
                role="group"
                aria-label={`Quantity of ${line.title}`}
              >
                <button
                  type="button"
                  onClick={() => onQuantity(line.id, line.quantity - 1)}
                  disabled={pending}
                  aria-label="One fewer"
                >
                  −
                </button>
                <output>{line.quantity}</output>
                <button
                  type="button"
                  onClick={() => onQuantity(line.id, line.quantity + 1)}
                  disabled={pending || line.quantity >= line.available}
                  aria-label="One more"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="cart-line__remove"
                onClick={() => onRemove(line.id)}
                disabled={pending}
              >
                Remove
              </button>
            </div>
          </div>

          <p className="cart-line__price">
            <Money paise={line.unitPriceInPaise * line.quantity} />
          </p>
        </li>
      ))}
    </ul>
  );
}
