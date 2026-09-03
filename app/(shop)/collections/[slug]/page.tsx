import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui";
import { ProductCard } from "@/components/shop/ProductCard";
import { CatalogControls } from "@/components/shop/CatalogControls";
import { getCollections, listProducts, parseSort } from "@/lib/catalog";

/**
 * Rendered on demand rather than prerendered: the sort lives in the query
 * string, and reading searchParams makes a route dynamic whatever
 * generateStaticParams says. It stays fast anyway — getCollections and
 * getProducts are both behind unstable_cache, so a request touches the
 * database only after a revalidation.
 */
export const revalidate = 3600;

async function findCollection(slug: string) {
  return (await getCollections()).find((c) => c.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const collection = await findCollection((await params).slug);
  if (!collection) return {};
  return {
    title: `${collection.title} — Folks & Florets`,
    description: collection.description ?? undefined,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const collection = await findCollection(slug);
  if (!collection) notFound();

  const sort = parseSort((await searchParams).sort);
  const [collections, products] = await Promise.all([
    getCollections(),
    listProducts({ collection: slug, sort }),
  ]);

  return (
    <>
      <header className="shop__head">
        <Breadcrumb
          trail={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: collection.title },
          ]}
        />
        <p className="eyebrow">The Collections</p>
        <h1 className="display display--md">{collection.title}</h1>
        {collection.description ? (
          <p className="lede">{collection.description}</p>
        ) : null}
      </header>

      <CatalogControls
        collections={collections}
        activeCollection={slug}
        activeSort={sort}
        basePath={`/collections/${slug}`}
      />

      <ul className="product-grid">
        {products.map((product, index) => (
          <li key={product.slug}>
            <ProductCard product={product} priority={index < 4} />
          </li>
        ))}
      </ul>
    </>
  );
}
