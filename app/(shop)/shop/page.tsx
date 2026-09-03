import type { Metadata } from "next";
import { Breadcrumb, EmptyState, ButtonLink } from "@/components/ui";
import { ProductCard } from "@/components/shop/ProductCard";
import { CatalogControls } from "@/components/shop/CatalogControls";
import { getCollections, listProducts, parseSort } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop — Folks & Florets",
  description:
    "Aromatics, epicurean provisions and preserved botanicals, given alone or composed into keepsake suites.",
};

/** Catalogue pages are static and refreshed on write via revalidateTag. */
export const revalidate = 3600;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const collections = await getCollections();
  const collection = collections.find((c) => c.slug === params.collection);
  const products = await listProducts({ collection: collection?.slug, sort });

  return (
    <>
      <header className="shop__head">
        <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Shop" }]} />
        <p className="eyebrow">The Collections</p>
        <h1 className="display display--md">
          {collection ? collection.title : "Everything the house keeps"}
        </h1>
        <p className="lede">
          {collection?.description ??
            "Aromatics, epicurean provisions and preserved botanicals — given alone, or composed into a suite."}
        </p>
      </header>

      <CatalogControls
        collections={collections}
        activeCollection={collection?.slug}
        activeSort={sort}
      />

      {products.length ? (
        <ul className="product-grid">
          {products.map((product, index) => (
            <li key={product.slug}>
              <ProductCard product={product} priority={index < 4} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nothing in this collection yet"
          body="It is being composed. In the meantime, the rest of the house is open."
          action={<ButtonLink href="/shop">See everything</ButtonLink>}
        />
      )}

      <p className="shop__note">
        {products.length} {products.length === 1 ? "piece" : "pieces"}. Prices
        include the packaging they are given in. Photography is being shot —
        the plates you see are stand-ins.
      </p>
    </>
  );
}
