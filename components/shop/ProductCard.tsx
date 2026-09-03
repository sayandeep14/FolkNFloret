import Link from "next/link";
import Image from "next/image";
import { LOW_STOCK_AT, type ProductCardView } from "@/lib/catalog-types";
import { Money } from "@/components/ui";

/**
 * `unoptimized` because the images are still generated SVG placeholders and
 * Next's optimiser refuses SVG without `dangerouslyAllowSVG`. Phase 3 swaps in
 * raster photography and this flag comes off.
 */
export function ProductCard({
  product,
  priority,
}: {
  product: ProductCardView;
  priority?: boolean;
}) {
  const soldOut = product.available <= 0;
  const low = !soldOut && product.available <= LOW_STOCK_AT;
  const ranged = product.fromPaise !== product.toPaise;

  return (
    <article className="product-card">
      <Link className="product-card__link" href={`/products/${product.slug}`}>
        <div className="product-card__frame">
          {product.image ? (
            <Image
              className="ui-product-image"
              src={product.image.url}
              alt={product.image.alt}
              width={800}
              height={1000}
              sizes="(max-width: 720px) 90vw, (max-width: 1100px) 45vw, 30vw"
              priority={priority}
              unoptimized
            />
          ) : null}

          {soldOut ? (
            <p className="product-card__flag">Sold out</p>
          ) : low ? (
            <p className="product-card__flag product-card__flag--low">
              {product.available} left
            </p>
          ) : null}
        </div>

        {product.latin ? (
          <p className="product-card__latin">{product.latin}</p>
        ) : null}
        <h3 className="product-card__title">{product.title}</h3>
        {product.subtitle ? (
          <p className="product-card__sub">{product.subtitle}</p>
        ) : null}

        <p className="product-card__meta">
          <span>
            {ranged ? "From " : null}
            <Money paise={product.fromPaise} />
          </span>
          <b aria-hidden="true">↗</b>
        </p>
      </Link>
    </article>
  );
}
