"use client";

import { useState } from "react";
import { LOW_STOCK_AT, type VariantView } from "@/lib/catalog-types";
import { Button } from "@/components/ui";
import { useCart } from "@/components/cart/CartProvider";
import { Money } from "@/components/ui/Money";

/**
 * Variant choice, quantity and the bag. Client-side because price and
 * availability have to answer to the selected variant without a round trip.
 */
export function PurchasePanel({
  productTitle,
  variants,
}: {
  productTitle: string;
  variants: VariantView[];
}) {
  const { add, pending } = useCart();
  const firstInStock = variants.find((v) => v.available > 0) ?? variants[0];
  const [variantId, setVariantId] = useState(firstInStock.id);
  const [quantity, setQuantity] = useState(1);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const soldOut = variant.available <= 0;
  const low = !soldOut && variant.available <= LOW_STOCK_AT;
  // Never let the stepper offer more than we can actually pack.
  const ceiling = Math.max(1, Math.min(variant.available, 10));

  const setVariant = (id: string) => {
    const next = variants.find((v) => v.id === id);
    setVariantId(id);
    if (next) setQuantity((q) => Math.min(q, Math.max(1, next.available)));
  };

  return (
    <div className="purchase">
      <p className="purchase__price">
        <Money paise={variant.priceInPaise} />
        {variant.comparePaise && variant.comparePaise > variant.priceInPaise ? (
          <s>
            <Money paise={variant.comparePaise} />
          </s>
        ) : null}
      </p>

      {variants.length > 1 ? (
        <fieldset className="purchase__variants">
          <legend>Choose</legend>
          {variants.map((option) => (
            <label
              key={option.id}
              className={`purchase__variant${option.available <= 0 ? " is-out" : ""}`}
            >
              <input
                type="radio"
                name="variant"
                value={option.id}
                checked={option.id === variantId}
                onChange={() => setVariant(option.id)}
              />
              <span>{option.name ?? productTitle}</span>
              {option.available <= 0 ? <b>Sold out</b> : null}
            </label>
          ))}
        </fieldset>
      ) : null}

      <p className="purchase__stock" aria-live="polite">
        {soldOut
          ? "Sold out — write to us and we will tell you when the next batch is ready."
          : low
            ? `Only ${variant.available} left of this batch.`
            : "In stock, dispatched within two working days."}
      </p>

      <div className="purchase__actions">
        <div className="quantity" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={soldOut || quantity <= 1}
            aria-label="One fewer"
          >
            −
          </button>
          <output aria-live="polite">{quantity}</output>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(ceiling, q + 1))}
            disabled={soldOut || quantity >= ceiling}
            aria-label="One more"
          >
            +
          </button>
        </div>

        <Button
          full
          disabled={soldOut || pending}
          onClick={() => add(variant.id, quantity)}
        >
          {soldOut ? "Sold out" : pending ? "Adding…" : "Add to bag"}
        </Button>
      </div>

      <p className="purchase__sku">SKU {variant.sku}</p>
    </div>
  );
}
